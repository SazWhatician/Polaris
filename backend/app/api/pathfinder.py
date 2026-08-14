from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.agents.pathfinder_agent import PathfinderAgent, load_career_roadmaps
from app.core.deps import get_current_user_id
from app.models.pathfinder import CareerGoal, CareerPlan

router = APIRouter(prefix="/api/pathfinder", tags=["Pathfinder Career Agent"])


class PathfinderRequest(BaseModel):
    career_goal_id: str = Field(description="ID of the career goal to analyze against")


@router.get("/goals", response_model=list[CareerGoal])
async def list_career_goals():
    """List all available career goals from the seed roadmap data."""
    roadmaps = load_career_roadmaps()
    return [CareerGoal(**r) for r in roadmaps]


@router.post("/analyze", response_model=CareerPlan)
async def analyze_career_path(
    req: PathfinderRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Run the pathfinder agent: compare user skills against a career goal and generate a learning plan."""
    agent = PathfinderAgent()
    graph = agent.compile()

    result = await graph.ainvoke({
        "user_id": user_id,
        "career_goal_id": req.career_goal_id,
        "career_goal": None,
        "twin_data": None,
        "skill_analysis": None,
        "career_plan": None,
        "error": None,
    })

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"],
        )

    plan_data = result.get("career_plan")
    if not plan_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate career plan.",
        )

    return CareerPlan(**plan_data)
