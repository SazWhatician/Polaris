import pytest
from app.agents.pathfinder_agent import PathfinderAgent, load_career_roadmaps


def test_load_career_roadmaps():
    roadmaps = load_career_roadmaps()
    assert len(roadmaps) >= 4
    goal_ids = [r["id"] for r in roadmaps]
    assert "ml_engineer" in goal_ids
    assert "backend_engineer" in goal_ids


@pytest.mark.asyncio
async def test_pathfinder_agent_execution():
    agent = PathfinderAgent()
    graph = agent.compile()

    result = await graph.ainvoke({
        "user_id": "test_user_pathfinder",
        "career_goal_id": "ml_engineer",
        "career_goal": None,
        "twin_data": None,
        "skill_analysis": None,
        "career_plan": None,
        "error": None,
    })

    assert result.get("error") is None
    plan = result.get("career_plan")
    assert plan is not None
    assert plan["career_goal"]["id"] == "ml_engineer"
    assert "summary" in plan
