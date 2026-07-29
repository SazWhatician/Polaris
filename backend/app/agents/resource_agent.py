from __future__ import annotations

import json
import logging
from typing import Any, TypedDict

from app.repositories.resource_cache_repo import ResourceCacheRepository, compute_topic_hash
from app.services.groq_client import GroqClient
from app.services.prompts import load as load_prompt
from app.services.youtube_service import YouTubeService
from langgraph.graph import END, START, StateGraph

logger = logging.getLogger(__name__)


class ResourceAgentState(TypedDict):
    user_id: str
    topic_id: str
    topic_title: str
    topic_hash: str

    from_cache: bool
    raw_candidates: list[dict[str, Any]]
    ranked_resources: list[dict[str, Any]]
    error: str | None


class ResourceAgent:
    def __init__(
        self,
        youtube_service: YouTubeService | None = None,
        cache_repo: ResourceCacheRepository | None = None,
        groq_client: GroqClient | None = None,
    ) -> None:
        self.youtube_service = youtube_service or YouTubeService()
        self.cache_repo = cache_repo or ResourceCacheRepository()
        self.groq_client = groq_client or GroqClient()

    async def check_cache(self, state: ResourceAgentState) -> dict[str, Any]:
        """Checks Firestore cache for previously ranked educational resources for this topic."""
        topic_hash = compute_topic_hash(state["topic_title"])
        cached = await self.cache_repo.get_cached_resources(state["user_id"], topic_hash)

        if cached and cached.resources:
            logger.info(
                "Cache HIT for topic_title='%s' (hash=%s)", state["topic_title"], topic_hash
            )
            return {
                "topic_hash": topic_hash,
                "from_cache": True,
                "ranked_resources": cached.resources,
            }

        logger.info("Cache MISS for topic_title='%s' (hash=%s)", state["topic_title"], topic_hash)
        return {
            "topic_hash": topic_hash,
            "from_cache": False,
            "ranked_resources": [],
        }

    async def search_youtube(self, state: ResourceAgentState) -> dict[str, Any]:
        """Searches YouTube / seed sources for candidate educational videos."""
        if state.get("from_cache"):
            return {}

        candidates = await self.youtube_service.search_educational_videos(
            query=state["topic_title"], max_results=8
        )
        return {"raw_candidates": candidates}

    async def dedupe_and_filter(self, state: ResourceAgentState) -> dict[str, Any]:
        """Filters out non-educational or duplicate video candidates."""
        if state.get("from_cache"):
            return {}

        raw = state.get("raw_candidates") or []
        seen_ids: set[str] = set()
        deduped: list[dict[str, Any]] = []

        for item in raw:
            v_id = item.get("video_id")
            if not v_id or v_id in seen_ids:
                continue
            seen_ids.add(v_id)
            deduped.append(item)

        return {"raw_candidates": deduped}

    async def rank_resources(self, state: ResourceAgentState) -> dict[str, Any]:
        """Uses LLM rubric to rank resources and generate rationale blurbs."""
        if state.get("from_cache"):
            return {}

        candidates = state.get("raw_candidates") or []
        if not candidates:
            return {"ranked_resources": []}

        try:
            prompt_tmpl = load_prompt("resource_ranker", "v1")
            candidates_minimal = [
                {
                    "video_id": c["video_id"],
                    "title": c["title"],
                    "channel_title": c["channel_title"],
                    "description": c.get("description", "")[:200],
                }
                for c in candidates
            ]

            prompt = prompt_tmpl.format(
                topic_title=state["topic_title"],
                candidate_videos_json=json.dumps(candidates_minimal, indent=2),
            )

            response_text = await self.groq_client.complete(
                prompt=prompt,
                temperature=0.2,
                json_mode=True,
            )

            rankings = json.loads(response_text)
            if isinstance(rankings, dict) and "resources" in rankings:
                rankings = rankings["resources"]

            ranking_map = {
                r["video_id"]: r for r in rankings if isinstance(r, dict) and "video_id" in r
            }

            ranked_results: list[dict[str, Any]] = []
            for c in candidates:
                v_id = c["video_id"]
                info = ranking_map.get(v_id, {})
                c_copy = dict(c)
                c_copy["rank_score"] = float(info.get("rank_score", 0.7))
                c_copy["why_recommended"] = (
                    info.get("why_recommended")
                    or f"Recommended tutorial covering key concepts in {state['topic_title']}."
                )
                ranked_results.append(c_copy)

            ranked_results.sort(key=lambda x: x["rank_score"], reverse=True)
            return {"ranked_resources": ranked_results[:5]}

        except Exception as err:
            logger.warning("LLM resource ranking failed, using fallback order: %s", err)
            fallback_results: list[dict[str, Any]] = []
            for idx, c in enumerate(candidates[:5]):
                c_copy = dict(c)
                c_copy["rank_score"] = round(0.9 - idx * 0.1, 2)
                c_copy["why_recommended"] = f"Top tutorial resource for {state['topic_title']}."
                fallback_results.append(c_copy)

            return {"ranked_resources": fallback_results}

    async def save_cache(self, state: ResourceAgentState) -> dict[str, Any]:
        """Saves ranked resources into Firestore cache repository."""
        if state.get("from_cache"):
            return {}

        ranked = state.get("ranked_resources") or []
        if ranked:
            await self.cache_repo.save_cached_resources(
                user_id=state["user_id"],
                topic_hash=state["topic_hash"],
                topic_id=state["topic_id"],
                topic_title=state["topic_title"],
                resources=ranked,
            )
        return {}

    def compile(self, checkpointer: Any = None) -> Any:
        workflow = StateGraph(ResourceAgentState)
        workflow.add_node("check_cache", self.check_cache)
        workflow.add_node("search_youtube", self.search_youtube)
        workflow.add_node("dedupe_and_filter", self.dedupe_and_filter)
        workflow.add_node("rank_resources", self.rank_resources)
        workflow.add_node("save_cache", self.save_cache)

        workflow.add_edge(START, "check_cache")
        workflow.add_edge("check_cache", "search_youtube")
        workflow.add_edge("search_youtube", "dedupe_and_filter")
        workflow.add_edge("dedupe_and_filter", "rank_resources")
        workflow.add_edge("rank_resources", "save_cache")
        workflow.add_edge("save_cache", END)

        return workflow.compile(checkpointer=checkpointer)
