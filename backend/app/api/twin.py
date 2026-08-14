from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.agents.twin_agent import TwinAgent
from app.core.deps import get_current_user_id
from app.core.firebase import is_initialized
from app.models.twin import AcademicTwin, ReadinessQuery, TwinSignal
from app.repositories.graph_repo import GraphRepository
from app.services.twin_service import TwinService

router = APIRouter(prefix="/api/twin", tags=["Academic Digital Twin"])

_twin_service = TwinService()


@router.get("", response_model=AcademicTwin)
async def get_twin(user_id: str = Depends(get_current_user_id)):
    """Get the current academic twin state for the authenticated user."""
    return await _twin_service.get_twin(user_id)


@router.post("/signals", response_model=AcademicTwin)
async def ingest_signal(
    signal: TwinSignal,
    user_id: str = Depends(get_current_user_id),
):
    """Ingest a study signal (from chat, OCR, syllabus, or extension) and update the twin."""
    return await _twin_service.ingest_signal(user_id, signal)


class ReadinessResponse(BaseModel):
    target_concept: str
    ready: bool
    ready_prerequisites: list[dict] = []
    missing_prerequisites: list[dict] = []
    summary: str


@router.post("/readiness", response_model=ReadinessResponse)
async def check_readiness(
    query: ReadinessQuery,
    user_id: str = Depends(get_current_user_id),
):
    """Check if the user is ready to learn a given concept, based on prerequisite graph traversal."""
    agent = TwinAgent(twin_service=_twin_service, graph_repo=GraphRepository())
    graph = agent.compile()

    result = await graph.ainvoke({
        "user_id": user_id,
        "target_concept": query.concept,
        "twin_data": None,
        "graph_data": None,
        "readiness": None,
        "error": None,
    })

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )

    readiness = result.get("readiness") or {}
    return ReadinessResponse(
        target_concept=readiness.get("target_concept", query.concept),
        ready=readiness.get("ready", False),
        ready_prerequisites=readiness.get("ready_prerequisites", []),
        missing_prerequisites=readiness.get("missing_prerequisites", []),
        summary=readiness.get("summary", "Unable to determine readiness."),
    )
