from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.agents.gap_agent import GapAgent
from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, is_initialized
from app.models.gap import GapAnalysisResponse, GapRecommendation
from app.repositories.checkpoint_repo import FirestoreCheckpointSaver
from app.repositories.syllabus_repo import SyllabusRepository

router = APIRouter(prefix="/api/agents", tags=["agents"])


class GapRunRequest(BaseModel):
    syllabus_id: str = Field(description="The ID of the syllabus to analyze")


class GapRunResponse(BaseModel):
    thread_id: str = Field(description="The unique thread ID of the run")
    status: str = Field(
        description="The current status: 'running' | 'completed' | 'failed' | 'not_started'"
    )


def get_syllabus_repo() -> SyllabusRepository:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )
    return SyllabusRepository(get_firestore())


SyllabusRepoDep = Annotated[SyllabusRepository, Depends(get_syllabus_repo)]


def get_gap_agent_graph(request: Request) -> Any:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )
    rag_service = getattr(request.app.state, "rag_service", None)
    if not rag_service:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="RAG system unavailable")

    syllabus_repo = SyllabusRepository(get_firestore())
    groq_client = rag_service._groq
    agent = GapAgent(syllabus_repo=syllabus_repo, groq_client=groq_client)

    checkpointer = FirestoreCheckpointSaver(get_firestore())
    return agent.compile(checkpointer=checkpointer)


GapAgentGraphDep = Annotated[Any, Depends(get_gap_agent_graph)]


async def run_gap_agent_task(graph: Any, thread_id: str, user_id: str, syllabus_id: str) -> None:
    # Delete any existing checkpoints for this thread to guarantee a fresh run
    if hasattr(graph, "channels") and hasattr(graph, "checkpointer") and graph.checkpointer:
        await graph.checkpointer.adelete_thread(thread_id)

    state = {
        "user_id": user_id,
        "syllabus_id": syllabus_id,
        "document_ids": None,
        "raw_syllabus": None,
        "coverage_map": None,
        "gaps": {},
        "prerequisites": {},
        "recommendations": [],
        "retry_count": 0,
        "error": None,
    }
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await graph.ainvoke(state, config)
    except Exception:
        # Save error message to state if possible, though ainvoke raising usually indicates critical failure.
        pass


@router.post("/gap/run", response_model=GapRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_gap_analysis(
    body: GapRunRequest,
    user: CurrentUser,
    graph: GapAgentGraphDep,
    background_tasks: BackgroundTasks,
    syllabus_repo: SyllabusRepoDep,
) -> GapRunResponse:
    syllabus = await syllabus_repo.get(user.uid, body.syllabus_id)
    if not syllabus:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Syllabus not found")

    thread_id = f"{user.uid}:{body.syllabus_id}"
    background_tasks.add_task(run_gap_agent_task, graph, thread_id, user.uid, body.syllabus_id)

    return GapRunResponse(thread_id=thread_id, status="running")


@router.get("/gap/runs/{thread_id}", response_model=GapAnalysisResponse)
async def get_gap_analysis_status(
    thread_id: str,
    user: CurrentUser,
    graph: GapAgentGraphDep,
) -> GapAnalysisResponse:
    # Access control check
    parts = thread_id.split(":", 1)
    if len(parts) != 2 or parts[0] != user.uid:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied to this run thread")

    syllabus_id = parts[1]
    config = {"configurable": {"thread_id": thread_id}}
    state_snapshot = await graph.aget_state(config)

    if not state_snapshot.values:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No run found for this thread ID")

    values = state_snapshot.values
    error = values.get("error")

    # Determine status: if state_snapshot.next is empty, it has completed (or failed)
    if error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Run failed: {error}")

    if state_snapshot.next:
        # Not finished yet
        raise HTTPException(status.HTTP_202_ACCEPTED, detail="Gap analysis is still running")

    recs = [GapRecommendation.model_validate(r) for r in values.get("recommendations", [])]

    from datetime import UTC, datetime

    return GapAnalysisResponse(
        syllabus_id=syllabus_id,
        gaps=values.get("gaps", {}),
        prerequisites=values.get("prerequisites", {}),
        recommendations=recs,
        updated_at=datetime.now(UTC).isoformat(),
    )


class UpdateRecommendationsRequest(BaseModel):
    recommendations: list[GapRecommendation] = Field(
        description="The reordered list of study recommendations"
    )


@router.put("/gap/runs/{thread_id}", response_model=GapAnalysisResponse)
async def update_gap_recommendations(
    thread_id: str,
    body: UpdateRecommendationsRequest,
    user: CurrentUser,
    graph: GapAgentGraphDep,
) -> GapAnalysisResponse:
    # Access control check
    parts = thread_id.split(":", 1)
    if len(parts) != 2 or parts[0] != user.uid:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Access denied to this run thread")

    syllabus_id = parts[1]
    config = {"configurable": {"thread_id": thread_id}}
    state_snapshot = await graph.aget_state(config)

    if not state_snapshot.values:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No run found for this thread ID")

    values = state_snapshot.values
    error = values.get("error")
    if error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Run failed: {error}")

    new_values = {**values, "recommendations": [r.model_dump() for r in body.recommendations]}

    # Save update state back in checkpointer
    await graph.aupdate_state(config, new_values, as_node="generate_recommendations")

    from datetime import UTC, datetime

    return GapAnalysisResponse(
        syllabus_id=syllabus_id,
        gaps=new_values.get("gaps", {}),
        prerequisites=new_values.get("prerequisites", {}),
        recommendations=body.recommendations,
        updated_at=datetime.now(UTC).isoformat(),
    )
