from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
import pytest

from app.agents.planner_agent import PlannerAgent


@pytest.mark.asyncio
async def test_planner_agent_invalid_exam_date():
    mock_plan_repo = MagicMock()
    mock_plan_repo.save_plan = AsyncMock()

    agent = PlannerAgent(plan_repo=mock_plan_repo)
    graph = agent.compile()

    state = {
        "user_id": "user123",
        "exam_date": "invalid-date",
        "daily_hours": 2.0,
        "topic_gaps": [],
        "schedules": [],
        "generated_plan": None,
        "error": None,
    }

    res = await graph.ainvoke(state)
    assert res["error"] == "Invalid exam date format. Expected YYYY-MM-DD"
    assert res["generated_plan"] is None
    mock_plan_repo.save_plan.assert_not_called()


@pytest.mark.asyncio
async def test_planner_agent_valid_execution():
    mock_plan_repo = MagicMock()
    mock_plan_repo.save_plan = AsyncMock()

    agent = PlannerAgent(plan_repo=mock_plan_repo)
    graph = agent.compile()

    state = {
        "user_id": "user123",
        "exam_date": "2026-12-31",
        "daily_hours": 3.0,
        "topic_gaps": [
            {"topic_id": "t1", "topic_title": "Dynamic Programming", "priority": "high"},
            {"topic_id": "t2", "topic_title": "Graph Algorithms", "priority": "medium"},
        ],
        "schedules": [],
        "generated_plan": None,
        "error": None,
    }

    res = await graph.ainvoke(state)
    assert res["error"] is None
    assert res["generated_plan"] is not None
    assert res["generated_plan"]["user_id"] == "user123"
    assert len(res["generated_plan"]["schedules"]) > 0
    mock_plan_repo.save_plan.assert_called_once()
