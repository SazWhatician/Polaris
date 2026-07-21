from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any
import pytest

from app.api.agents import get_gap_agent_graph, get_syllabus_repo
from app.core.config import get_settings
from app.core.deps import verify_id_token
from app.models.syllabus import Syllabus, SyllabusCoverage, Topic, TopicCoverage
from app.models.user import AuthenticatedUser
from app.agents.gap_agent import GapAgent
from langgraph.checkpoint.memory import MemorySaver
from httpx import ASGITransport, AsyncClient

from tests.unit.test_gap_agent import FakeSyllabusRepo, FakeGroqClient


@pytest.fixture
async def api() -> AsyncIterator[tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any]]:
    from app.main import _build_app

    app = _build_app(get_settings())
    syllabus_repo = FakeSyllabusRepo()
    groq_client = FakeGroqClient()

    # Compile the GapAgent using the fake syllabus repo, groq client, and MemorySaver checkpointer
    agent = GapAgent(syllabus_repo=syllabus_repo, groq_client=groq_client)  # type: ignore[arg-type]
    checkpointer = MemorySaver()
    graph = agent.compile(checkpointer=checkpointer)

    app.dependency_overrides[verify_id_token] = lambda: AuthenticatedUser(
        uid="alice", email="alice@example.com"
    )
    app.dependency_overrides[get_gap_agent_graph] = lambda: graph
    app.dependency_overrides[get_syllabus_repo] = lambda: syllabus_repo

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        async with app.router.lifespan_context(app):
            yield ac, syllabus_repo, groq_client, graph


@pytest.mark.asyncio
async def test_trigger_gap_analysis_not_found(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, _, _, _ = api
    resp = await client.post("/api/agents/gap/run", json={"syllabus_id": "nonexistent"})
    assert resp.status_code == 404
    assert "Syllabus not found" in resp.text


@pytest.mark.asyncio
async def test_trigger_gap_analysis_success(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, syllabus_repo, groq_client, graph = api

    # Seed syllabus
    t1 = Topic(id="t1", title="Basics", description="Intro", subtopics=[])
    syllabus = Syllabus(
        id="s1",
        user_id="alice",
        name="Network Security",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        tree=[t1],
    )
    syllabus_repo.syllabi[("alice", "s1")] = syllabus

    resp = await client.post("/api/agents/gap/run", json={"syllabus_id": "s1"})
    assert resp.status_code == 202
    body = resp.json()
    assert body["thread_id"] == "alice:s1"
    assert body["status"] == "running"


@pytest.mark.asyncio
async def test_get_gap_analysis_status_forbidden(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, _, _, _ = api
    # Requesting a thread_id that doesn't belong to 'alice'
    resp = await client.get("/api/agents/gap/runs/bob:s1")
    assert resp.status_code == 403
    assert "Access denied" in resp.text


@pytest.mark.asyncio
async def test_get_gap_analysis_status_not_found(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, _, _, _ = api
    resp = await client.get("/api/agents/gap/runs/alice:s1")
    assert resp.status_code == 404
    assert "No run found" in resp.text


@pytest.mark.asyncio
async def test_get_gap_analysis_completed_recommendations(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, syllabus_repo, groq_client, graph = api

    thread_id = "alice:s1"
    config = {"configurable": {"thread_id": thread_id}}

    # Seed state in the checkpointer directly to mock a completed run
    state = {
        "user_id": "alice",
        "syllabus_id": "s1",
        "document_ids": None,
        "raw_syllabus": {"id": "s1", "name": "Security", "tree": [{"id": "t1", "title": "Firewalls"}]},
        "coverage_map": {"overall_score": 10.0, "topics": {"t1": {"score": 10.0, "status": "none"}}},
        "gaps": {"t1": "missing"},
        "prerequisites": {"t1": []},
        "recommendations": [
            {
                "topic_id": "t1",
                "title": "Firewalls",
                "status": "missing",
                "reason": "Missing topic",
                "actionable_steps": ["Review firewalls."],
                "estimated_hours": 2.0,
            }
        ],
        "retry_count": 0,
        "error": None,
    }
    # Save checkpoint to the graph memory saver
    await graph.aupdate_state(config, state, as_node="generate_recommendations")

    # Verify state next is empty, representing finished execution
    resp = await client.get(f"/api/agents/gap/runs/{thread_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["syllabus_id"] == "s1"
    assert len(body["recommendations"]) == 1
    assert body["recommendations"][0]["topic_id"] == "t1"
    assert body["recommendations"][0]["estimated_hours"] == 2.0


@pytest.mark.asyncio
async def test_update_gap_recommendations(
    api: tuple[AsyncClient, FakeSyllabusRepo, FakeGroqClient, Any],
) -> None:
    client, syllabus_repo, groq_client, graph = api

    thread_id = "alice:s1"
    config = {"configurable": {"thread_id": thread_id}}

    state = {
        "user_id": "alice",
        "syllabus_id": "s1",
        "document_ids": None,
        "raw_syllabus": {"id": "s1", "name": "Security", "tree": [{"id": "t1", "title": "Firewalls"}]},
        "coverage_map": {"overall_score": 10.0, "topics": {"t1": {"score": 10.0, "status": "none"}}},
        "gaps": {"t1": "missing"},
        "prerequisites": {"t1": []},
        "recommendations": [
            {
                "topic_id": "t1",
                "title": "Firewalls",
                "status": "missing",
                "reason": "Missing topic",
                "actionable_steps": ["Review firewalls."],
                "estimated_hours": 2.0,
            }
        ],
        "retry_count": 0,
        "error": None,
    }
    await graph.aupdate_state(config, state, as_node="generate_recommendations")

    # Perform PUT request to reorder/update recommendations
    updated_recs = [
        {
            "topic_id": "t1",
            "title": "Firewalls v2",
            "status": "weak",
            "reason": "Updated reason",
            "actionable_steps": ["Step 1", "Step 2"],
            "estimated_hours": 3.5,
        }
    ]
    resp = await client.put(f"/api/agents/gap/runs/{thread_id}", json={"recommendations": updated_recs})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["recommendations"]) == 1
    assert body["recommendations"][0]["title"] == "Firewalls v2"
    assert body["recommendations"][0]["status"] == "weak"
    assert body["recommendations"][0]["estimated_hours"] == 3.5

    # Fetch status again to verify persistence
    resp_get = await client.get(f"/api/agents/gap/runs/{thread_id}")
    assert resp_get.status_code == 200
    body_get = resp_get.json()
    assert body_get["recommendations"][0]["title"] == "Firewalls v2"

