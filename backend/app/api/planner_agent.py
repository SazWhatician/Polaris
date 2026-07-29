from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from app.agents.planner_agent import PlannerAgent
from app.core.deps import CurrentUser
from app.core.firebase import get_firestore, is_initialized
from app.models.planner import PlanDiffResponse, RevisionPlan
from app.repositories.checkpoint_repo import FirestoreCheckpointSaver
from app.repositories.plan_repo import PlanRepository
from app.services.plan_diff_service import compute_plan_diff

router = APIRouter(prefix="/api/agents/planner", tags=["planner_agent"])


class PlannerRunRequest(BaseModel):
    exam_date: str = Field(description="Target exam date in YYYY-MM-DD format")
    daily_hours: float = Field(default=2.0, description="Available study hours per day")
    topic_gaps: list[dict[str, Any]] = Field(
        default_factory=list, description="List of topic gap objects (topic_id, topic_title, priority)"
    )


class PlannerRunResponse(BaseModel):
    thread_id: str = Field(description="Unique thread ID of the planner run")
    status: str = Field(description="Current run status: 'running' | 'completed' | 'failed'")


def get_planner_agent_graph(request: Request) -> Any:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )

    plan_repo = PlanRepository(get_firestore())
    agent = PlannerAgent(plan_repo=plan_repo)
    checkpointer = FirestoreCheckpointSaver(get_firestore())
    return agent.compile(checkpointer=checkpointer)


PlannerAgentGraphDep = Annotated[Any, Depends(get_planner_agent_graph)]


async def run_planner_agent_task(
    graph: Any,
    thread_id: str,
    user_id: str,
    exam_date: str,
    daily_hours: float,
    topic_gaps: list[dict[str, Any]],
) -> None:
    if hasattr(graph, "checkpointer") and graph.checkpointer:
        await graph.checkpointer.adelete_thread(thread_id)

    state = {
        "user_id": user_id,
        "exam_date": exam_date,
        "daily_hours": daily_hours,
        "topic_gaps": topic_gaps,
        "schedules": [],
        "generated_plan": None,
        "error": None,
    }
    config = {"configurable": {"thread_id": thread_id}}
    try:
        await graph.ainvoke(state, config)
    except Exception:
        pass


@router.post("/run", response_model=PlannerRunResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_revision_plan(
    body: PlannerRunRequest,
    user: CurrentUser,
    graph: PlannerAgentGraphDep,
    background_tasks: BackgroundTasks,
) -> PlannerRunResponse:
    thread_id = f"{user.uid}:plan:{body.exam_date}"

    background_tasks.add_task(
        run_planner_agent_task,
        graph,
        thread_id,
        user.uid,
        body.exam_date,
        body.daily_hours,
        body.topic_gaps,
    )
    return PlannerRunResponse(thread_id=thread_id, status="running")


@router.get("/runs/{thread_id}", response_model=RevisionPlan)
async def get_planner_run_status(
    thread_id: str,
    user: CurrentUser,
    graph: PlannerAgentGraphDep,
) -> RevisionPlan:
    if not thread_id.startswith(f"{user.uid}:"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Access denied to this planner thread"
        )

    config = {"configurable": {"thread_id": thread_id}}
    snapshot = await graph.aget_state(config)

    if not snapshot or not snapshot.values:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Revision planner thread not found")

    values = snapshot.values
    next_nodes = snapshot.next

    if next_nodes:
        raise HTTPException(
            status.HTTP_202_ACCEPTED, detail="Revision plan generation in progress"
        )

    if values.get("error"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=values["error"])

    plan_dict = values.get("generated_plan")
    if not plan_dict:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No revision plan generated"
        )

    return RevisionPlan(**plan_dict)


@router.get("/latest", response_model=RevisionPlan)
async def get_latest_revision_plan(
    user: CurrentUser,
) -> RevisionPlan:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )

    plan_repo = PlanRepository(get_firestore())
    plan = await plan_repo.get_latest_plan(user.uid)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No revision plan found")

    return plan


@router.get("/diff", response_model=PlanDiffResponse)
async def get_revision_plan_diff(
    user: CurrentUser,
    compare_plan_id: str = Query(..., description="Plan ID to compare against the latest plan"),
) -> PlanDiffResponse:
    if not is_initialized():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firestore backend unavailable"
        )

    plan_repo = PlanRepository(get_firestore())
    latest_plan = await plan_repo.get_latest_plan(user.uid)
    if not latest_plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Latest revision plan not found")

    compare_plan = await plan_repo.get_plan_by_id(user.uid, compare_plan_id)
    if not compare_plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Comparison plan not found")

    return compute_plan_diff(old_plan=compare_plan, new_plan=latest_plan)
