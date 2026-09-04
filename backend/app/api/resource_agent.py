from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.agents.resource_agent import ResourceAgent
from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, is_initialized
from app.core.logging import get_logger
from app.models.resource import ResourceDiscoveryResponse, ResourceItem
from app.repositories.checkpoint_repo import FirestoreCheckpointSaver
from app.repositories.resource_cache_repo import ResourceCacheRepository, compute_topic_hash
from app.services.youtube_service import YouTubeService
from langgraph.checkpoint.memory import MemorySaver

router = APIRouter(prefix="/api/agents/resource", tags=["resource_agent"])

logger = get_logger(__name__)

# Shared memory checkpointer to ensure state persistence across async request-response cycles
_shared_memory_saver = MemorySaver()


class ResourceRunRequest(BaseModel):
    topic_id: str = Field(description="The topic ID")
    topic_title: str = Field(description="The topic title or query string")


class ResourceRunResponse(BaseModel):
    thread_id: str = Field(description="Unique thread ID of the discovery run")
    status: str = Field(description="Current run status: 'running' | 'completed' | 'failed'")


class PlaylistItem(BaseModel):
    playlist_id: str
    title: str
    channel_title: str
    video_count: str
    url: str
    thumbnail_url: str


class BlockResourcesRequest(BaseModel):
    topic_title: str = Field(description="The topic or module block title")
    subtopics: list[str] = Field(
        default_factory=list, description="List of subtopic names in this block"
    )


class BlockResourcesResponse(BaseModel):
    topic_title: str
    playlists: list[PlaylistItem]
    videos: list[ResourceItem]
    subtopics_resources: dict[str, list[ResourceItem]]


def get_resource_agent_graph(request: Request) -> Any:
    groq_client = getattr(request.app.state, "groq_client", None)
    if not groq_client:
        rag_service = getattr(request.app.state, "rag_service", None)
        if rag_service:
            groq_client = getattr(rag_service, "_groq", None)

    if is_initialized():
        db = get_firestore()
        cache_repo = ResourceCacheRepository(db)
        checkpointer = FirestoreCheckpointSaver(db)
    else:
        cache_repo = None
        checkpointer = _shared_memory_saver

    agent = ResourceAgent(cache_repo=cache_repo, groq_client=groq_client)
    return agent.compile(checkpointer=checkpointer)


ResourceAgentGraphDep = Annotated[Any, Depends(get_resource_agent_graph)]


async def run_resource_agent_task(
    graph: Any, thread_id: str, user_id: str, topic_id: str, topic_title: str
) -> None:
    if (
        hasattr(graph, "checkpointer")
        and graph.checkpointer
        and hasattr(graph.checkpointer, "adelete_thread")
    ):
        try:
            await graph.checkpointer.adelete_thread(thread_id)
        except Exception as e:
            logger.warning("Checkpointer thread cleanup note: %s", e)

    state = {
        "user_id": user_id,
        "topic_id": topic_id,
        "topic_title": topic_title,
        "topic_hash": compute_topic_hash(topic_title),
        "from_cache": False,
        "raw_candidates": [],
        "ranked_resources": [],
        "error": None,
    }
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await graph.ainvoke(state, config)
    except Exception as err:
        logger.error("Resource agent discovery graph invocation error: %s", err)


@router.post("/run", response_model=ResourceRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_resource_discovery(
    body: ResourceRunRequest,
    user: CurrentUser,
    graph: ResourceAgentGraphDep,
    background_tasks: BackgroundTasks,
) -> ResourceRunResponse:
    safe_topic_slug = compute_topic_hash(body.topic_title)[:16]
    thread_id = f"{user.uid}:res:{safe_topic_slug}"

    background_tasks.add_task(
        run_resource_agent_task, graph, thread_id, user.uid, body.topic_id, body.topic_title
    )
    return ResourceRunResponse(thread_id=thread_id, status="running")


@router.post("/quick", response_model=ResourceDiscoveryResponse)
async def quick_discover_resources(
    body: ResourceRunRequest,
    user: CurrentUser,
    graph: ResourceAgentGraphDep,
) -> ResourceDiscoveryResponse:
    """Synchronously discovers and ranks resources, bypassing polling latency."""
    safe_topic_slug = compute_topic_hash(body.topic_title)[:16]
    thread_id = f"{user.uid}:quick:{safe_topic_slug}:{int(datetime.now(UTC).timestamp())}"

    state = {
        "user_id": user.uid,
        "topic_id": body.topic_id,
        "topic_title": body.topic_title,
        "topic_hash": compute_topic_hash(body.topic_title),
        "from_cache": False,
        "raw_candidates": [],
        "ranked_resources": [],
        "error": None,
    }
    config = {"configurable": {"thread_id": thread_id}}

    resources: list[ResourceItem] = []
    from_cache = False

    try:
        result_state = await graph.ainvoke(state, config)
        from_cache = result_state.get("from_cache", False)
        ranked_data = result_state.get("ranked_resources") or []
        resources = [ResourceItem(**item) for item in ranked_data if isinstance(item, dict)]

        # If ranking returned empty, fallback to raw candidates from state
        if not resources:
            raw = result_state.get("raw_candidates") or []
            if raw:
                resources = [
                    ResourceItem(
                        title=c.get("title", ""),
                        video_id=c.get("video_id", ""),
                        url=c.get("url", ""),
                        channel_title=c.get("channel_title", ""),
                        thumbnail_url=c.get("thumbnail_url", ""),
                        duration=c.get("duration", "N/A"),
                        publication_date=c.get("publication_date"),
                        view_count=c.get("view_count"),
                        description=c.get("description", ""),
                        rank_score=0.8,
                        why_recommended="Top educational tutorial matching this syllabus topic.",
                    )
                    for c in raw
                    if isinstance(c, dict)
                ]
    except Exception as exc:
        logger.error("Resource agent graph quick discovery error: %s", exc)

    # Guaranteed non-empty fallback: direct YouTube search if graph failed or returned empty
    if not resources:
        try:
            yt = YouTubeService()
            fallback_videos = await yt.search_videos(body.topic_title, max_results=6)
            resources = [
                ResourceItem(
                    title=c.get("title", ""),
                    video_id=c.get("video_id", ""),
                    url=c.get("url", ""),
                    channel_title=c.get("channel_title", ""),
                    thumbnail_url=c.get("thumbnail_url", ""),
                    duration=c.get("duration", "N/A"),
                    publication_date=c.get("publication_date"),
                    view_count=c.get("view_count"),
                    description=c.get("description", ""),
                    rank_score=0.85,
                    why_recommended="High-relevance educational tutorial discovered for this topic.",
                )
                for c in fallback_videos
            ]
        except Exception as yt_err:
            logger.error("Direct YouTube fallback search error: %s", yt_err)

    return ResourceDiscoveryResponse(
        topic_id=body.topic_id,
        topic_title=body.topic_title,
        resources=resources,
        from_cache=from_cache,
        updated_at=datetime.now(UTC).isoformat(),
    )


@router.post("/block", response_model=BlockResourcesResponse)
async def discover_block_resources(
    body: BlockResourcesRequest,
    user: CurrentUser,
) -> BlockResourcesResponse:
    """Discovers full-course playlists, main topic videos, and subtopic-categorized tutorials for a syllabus block."""
    yt_service = YouTubeService()
    data = await yt_service.get_block_resources(body.topic_title, body.subtopics)

    playlists = [PlaylistItem(**p) for p in data["playlists"]]
    main_videos = [ResourceItem(**v) for v in data["videos"]]

    subtopic_map: dict[str, list[ResourceItem]] = {}
    for sub, vids in data["subtopics_resources"].items():
        subtopic_map[sub] = [ResourceItem(**v) for v in vids]

    return BlockResourcesResponse(
        topic_title=data["topic_title"],
        playlists=playlists,
        videos=main_videos,
        subtopics_resources=subtopic_map,
    )


@router.get("/runs/{thread_id}", response_model=ResourceDiscoveryResponse)
async def get_resource_discovery_status(
    thread_id: str,
    user: CurrentUser,
    graph: ResourceAgentGraphDep,
) -> ResourceDiscoveryResponse:
    if not thread_id.startswith(f"{user.uid}:"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Access denied to this discovery thread"
        )

    config = {"configurable": {"thread_id": thread_id}}
    snapshot = await graph.aget_state(config)

    if not snapshot or not snapshot.values:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Resource discovery thread not found")

    values = snapshot.values
    next_nodes = snapshot.next

    if next_nodes:
        # Still running
        raise HTTPException(
            status.HTTP_202_ACCEPTED, detail="Resource discovery is still in progress"
        )

    ranked_data = values.get("ranked_resources") or []
    resources = [ResourceItem(**item) for item in ranked_data if isinstance(item, dict)]

    return ResourceDiscoveryResponse(
        topic_id=values.get("topic_id", ""),
        topic_title=values.get("topic_title", ""),
        resources=resources,
        from_cache=values.get("from_cache", False),
        updated_at=datetime.now(UTC).isoformat(),
    )


@router.get("/topic/{topic_title}", response_model=ResourceDiscoveryResponse)
async def get_cached_topic_resources(
    topic_title: str,
    user: CurrentUser,
) -> ResourceDiscoveryResponse:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )

    cache_repo = ResourceCacheRepository(get_firestore())
    topic_hash = compute_topic_hash(topic_title)
    cached = await cache_repo.get_cached_resources(user.uid, topic_hash)

    if not cached:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="No cached resources found for this topic"
        )

    resources = [ResourceItem(**item) for item in cached.resources if isinstance(item, dict)]

    return ResourceDiscoveryResponse(
        topic_id=cached.topic_id,
        topic_title=cached.topic_title,
        resources=resources,
        from_cache=True,
        updated_at=cached.cached_at,
    )
