from __future__ import annotations

import json
from typing import Any, TypedDict

from app.repositories.syllabus_repo import SyllabusRepository
from app.services.groq_client import GroqClient
from langgraph.graph import END, START, StateGraph


class GapAgentState(TypedDict):
    user_id: str
    syllabus_id: str
    document_ids: list[str] | None

    # State data updated across nodes
    raw_syllabus: dict[str, Any] | None
    coverage_map: dict[str, Any] | None

    # Classifications
    gaps: dict[str, str]  # topic_id -> "known" | "weak" | "missing"
    prerequisites: dict[str, list[str]]  # topic_id -> list of topic_ids

    # Recommendations
    recommendations: list[dict[str, Any]]  # ordered study recommendations

    # Errors & Retries
    retry_count: int
    error: str | None


PREREQ_PROMPT = """
You are an expert curriculum designer. Given a syllabus for a course, analyze the list of topics and determine the logical prerequisite relationships between them.

Here is the syllabus:
{syllabus_json}

For each topic, identify which other topics in the syllabus are its direct prerequisites (topics that must be learned BEFORE this topic).
Return a JSON object mapping each topic ID to a list of prerequisite topic IDs.
Example Output Format:
{{
  "topic-id-1": [],
  "topic-id-2": ["topic-id-1"],
  "topic-id-3": ["topic-id-1", "topic-id-2"]
}}

Only use valid topic IDs from the syllabus. Do not include self-references or circular dependencies. If a topic has no prerequisites, map it to an empty list [].
Return ONLY a valid JSON object. Do not include markdown code block styling or any explanation.
"""


RECOMMENDATIONS_PROMPT = """
You are an expert personal tutor. A student has identified several learning gaps in their syllabus.
We have prioritized these gaps for study.

Here is the syllabus:
{syllabus_json}

Here are the computed gaps (topic_id -> status):
{gaps_json}

Here is the prioritized list of gaps to study:
{ranked_gaps_json}

For each gap in the prioritized list, generate a tailored study recommendation in JSON format.
Your output must be a JSON object containing a list of recommendations under the key "recommendations".
Each recommendation in the list must have the following fields:
- "topic_id": The ID of the topic.
- "title": The title of the topic.
- "status": The status of the topic ("weak" or "missing").
- "reason": A short explanation of why this topic is recommended now (e.g., "Prerequisite for other_topic", "This is a fundamental topic completely missing from your notes").
- "actionable_steps": A list of 2-4 concrete, specific study actions (e.g., "Review Chapter 4 on X", "Solve practice problems on Y").
- "estimated_hours": A realistic estimate of study hours needed (e.g., 2.5).

Example Output Format:
{{
  "recommendations": [
    {{
      "topic_id": "topic-1",
      "title": "Introduction to Network Security",
      "status": "missing",
      "reason": "This is a fundamental prerequisite for Threat Modeling and is completely missing from your notes.",
      "actionable_steps": [
        "Read Chapter 1 of the textbook.",
        "Watch the introductory lecture video."
      ],
      "estimated_hours": 1.5
    }}
  ]
}}

Return ONLY a valid JSON object. Do not include markdown code block styling or any explanation.
"""


def sanitize_prerequisites(
    prereqs: dict[str, list[str]], valid_ids: set[str]
) -> dict[str, list[str]]:
    sanitized = {}
    for tid in valid_ids:
        raw_list = prereqs.get(tid, [])
        if not isinstance(raw_list, list):
            raw_list = []
        clean_list = []
        for p in raw_list:
            if p in valid_ids and p != tid:
                clean_list.append(p)
        sanitized[tid] = clean_list

    # Remove circular dependencies (simple cycles)
    for u in valid_ids:
        for v in list(sanitized[u]):
            if u in sanitized.get(v, []):
                if u in sanitized[v]:
                    sanitized[v].remove(u)
    return sanitized


def rank_gaps(
    gap_ids: list[str],
    prerequisites: dict[str, list[str]],
    original_order: list[str],
) -> list[str]:
    gap_set = set(gap_ids)

    gap_prereqs = {tid: [p for p in prerequisites.get(tid, []) if p in gap_set] for tid in gap_ids}

    # Calculate descendant gaps in dependency graph
    influence = {}
    for tid in gap_ids:
        visited = set()
        queue = [tid]
        while queue:
            curr = queue.pop(0)
            for other in gap_ids:
                if curr in prerequisites.get(other, []) and other not in visited:
                    visited.add(other)
                    queue.append(other)
        influence[tid] = len(visited)

    order_map = {tid: idx for idx, tid in enumerate(original_order)}

    result = []
    remaining = set(gap_ids)

    while remaining:
        # Find candidates with no prerequisites in remaining
        candidates = [tid for tid in remaining if not any(p in remaining for p in gap_prereqs[tid])]

        if not candidates:
            # Cycle detected: choose candidate with minimum remaining prereqs
            candidates = list(remaining)
            candidates.sort(
                key=lambda x: (
                    len([p for p in gap_prereqs[x] if p in remaining]),
                    -influence[x],
                    order_map.get(x, 999),
                )
            )
            chosen = candidates[0]
        else:
            candidates.sort(key=lambda x: (-influence[x], order_map.get(x, 999)))
            chosen = candidates[0]

        result.append(chosen)
        remaining.remove(chosen)

    return result


class GapAgent:
    def __init__(self, syllabus_repo: SyllabusRepository, groq_client: GroqClient) -> None:
        self.syllabus_repo = syllabus_repo
        self.groq_client = groq_client

    async def load_syllabus(self, state: GapAgentState) -> dict[str, Any]:
        user_id = state["user_id"]
        syllabus_id = state["syllabus_id"]
        syllabus = await self.syllabus_repo.get(user_id, syllabus_id)
        if not syllabus:
            return {"error": f"Syllabus {syllabus_id} not found."}

        raw_syllabus = {
            "id": syllabus.id,
            "user_id": syllabus.user_id,
            "name": syllabus.name,
            "tree": [t.model_dump() for t in syllabus.tree],
        }
        return {"raw_syllabus": raw_syllabus, "error": None}

    async def load_coverage(self, state: GapAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}
        user_id = state["user_id"]
        syllabus_id = state["syllabus_id"]
        coverage = await self.syllabus_repo.get_coverage(user_id, syllabus_id)
        if not coverage:
            return {"error": f"Coverage map for syllabus {syllabus_id} not found."}

        coverage_map = {
            "syllabus_id": coverage.syllabus_id,
            "overall_score": coverage.overall_score,
            "topics": {tid: c.model_dump() for tid, c in coverage.topics.items()},
        }
        return {"coverage_map": coverage_map, "error": None}

    async def assess_gaps(self, state: GapAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}

        raw_syllabus = state.get("raw_syllabus") or {}
        tree = raw_syllabus.get("tree") or []
        coverage_map = state.get("coverage_map") or {}
        topics_cov = coverage_map.get("topics") or {}

        gaps = {}

        def traverse(topics: list[dict[str, Any]]) -> None:
            for t in topics:
                tid = t["id"]
                cov = topics_cov.get(tid)
                if cov:
                    score = cov.get("score", 0.0)
                    status = cov.get("status", "none")
                else:
                    score = 0.0
                    status = "none"

                if status == "good" or score >= 70.0:
                    gaps[tid] = "known"
                elif status == "partial" or score >= 30.0:
                    gaps[tid] = "weak"
                else:
                    gaps[tid] = "missing"

                traverse(t.get("subtopics") or [])

        traverse(tree)
        return {"gaps": gaps}

    async def rank_topics(self, state: GapAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}

        raw_syllabus = state.get("raw_syllabus") or {}
        tree = raw_syllabus.get("tree") or []
        gaps = state.get("gaps") or {}

        valid_ids = []

        def traverse(topics: list[dict[str, Any]]) -> None:
            for t in topics:
                valid_ids.append(t["id"])
                traverse(t.get("subtopics") or [])

        traverse(tree)
        valid_id_set = set(valid_ids)

        try:
            prompt = PREREQ_PROMPT.format(syllabus_json=json.dumps(tree, indent=2))
            llm_response = await self.groq_client.complete(prompt, json_mode=True)
            raw_prereqs = json.loads(llm_response)
        except Exception:
            raw_prereqs = {}

        prereqs = sanitize_prerequisites(raw_prereqs, valid_id_set)
        gap_ids = [tid for tid in valid_ids if gaps.get(tid) in ("weak", "missing")]
        ranked_gaps = rank_gaps(gap_ids, prereqs, valid_ids)

        return {
            "prerequisites": prereqs,
            "recommendations": [{"topic_id": tid} for tid in ranked_gaps],
        }

    async def generate_recommendations(self, state: GapAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}

        raw_syllabus = state.get("raw_syllabus") or {}
        tree = raw_syllabus.get("tree") or []
        gaps = state.get("gaps") or {}
        recommendation_stubs = state.get("recommendations") or []
        ranked_gaps = [r["topic_id"] for r in recommendation_stubs]

        if not ranked_gaps:
            return {"recommendations": []}

        try:
            prompt = RECOMMENDATIONS_PROMPT.format(
                syllabus_json=json.dumps(tree, indent=2),
                gaps_json=json.dumps(gaps, indent=2),
                ranked_gaps_json=json.dumps(ranked_gaps, indent=2),
            )
            llm_response = await self.groq_client.complete(prompt, json_mode=True)
            data = json.loads(llm_response)
            recommendations = data.get("recommendations", [])

            recommendations_map = {r["topic_id"]: r for r in recommendations if "topic_id" in r}

            def find_title(topics: list[dict[str, Any]], tid: str) -> str | None:
                for t in topics:
                    if t["id"] == tid:
                        return t["title"]
                    res = find_title(t.get("subtopics") or [], tid)
                    if res:
                        return res
                return None

            final_recommendations = []
            for tid in ranked_gaps:
                rec = recommendations_map.get(tid) or {}
                final_recommendations.append(
                    {
                        "topic_id": tid,
                        "title": rec.get("title") or find_title(tree, tid) or f"Topic {tid}",
                        "status": gaps.get(tid, "missing"),
                        "reason": rec.get("reason") or "Recommended for study.",
                        "actionable_steps": rec.get("actionable_steps")
                        or ["Review this topic in study materials."],
                        "estimated_hours": float(rec.get("estimated_hours") or 2.0),
                    }
                )
        except Exception:
            final_recommendations = []
            for tid in ranked_gaps:
                final_recommendations.append(
                    {
                        "topic_id": tid,
                        "title": f"Topic {tid}",
                        "status": gaps.get(tid, "missing"),
                        "reason": "This topic was identified as a gap.",
                        "actionable_steps": ["Review this topic in study materials."],
                        "estimated_hours": 2.0,
                    }
                )

        return {"recommendations": final_recommendations}

    def compile(self, checkpointer: Any = None) -> Any:
        workflow = StateGraph(GapAgentState)
        workflow.add_node("load_syllabus", self.load_syllabus)
        workflow.add_node("load_coverage", self.load_coverage)
        workflow.add_node("assess_gaps", self.assess_gaps)
        workflow.add_node("rank_topics", self.rank_topics)
        workflow.add_node("generate_recommendations", self.generate_recommendations)

        workflow.add_edge(START, "load_syllabus")
        workflow.add_edge("load_syllabus", "load_coverage")
        workflow.add_edge("load_coverage", "assess_gaps")
        workflow.add_edge("assess_gaps", "rank_topics")
        workflow.add_edge("rank_topics", "generate_recommendations")
        workflow.add_edge("generate_recommendations", END)

        return workflow.compile(checkpointer=checkpointer)
