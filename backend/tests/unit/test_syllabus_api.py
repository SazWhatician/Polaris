from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import pytest
from app.api.syllabus import get_syllabus_service
from app.core.config import get_settings
from app.core.deps import verify_id_token
from app.models.syllabus import Syllabus, Topic
from app.models.user import AuthenticatedUser
from app.services.syllabus_service import SyllabusService
from httpx import ASGITransport, AsyncClient

from tests.unit.test_syllabus_service import (
    FakeDocRepo,
    FakeEmbedder,
    FakeGroq,
    FakePageRepo,
    FakeQdrant,
    FakeSyllabusRepo,
)


class _Svc(SyllabusService):
    """Subclass to preserve SyllabusService type while injecting fakes."""


def _make_service() -> SyllabusService:
    return _Svc(
        syllabus_repo=FakeSyllabusRepo(),  # type: ignore[arg-type]
        doc_repo=FakeDocRepo(),  # type: ignore[arg-type]
        page_repo=FakePageRepo(),  # type: ignore[arg-type]
        qdrant_repo=FakeQdrant([]),  # type: ignore[arg-type]
        embedder=FakeEmbedder(),  # type: ignore[arg-type]
        groq=FakeGroq(),  # type: ignore[arg-type]
    )


@pytest.fixture
async def api() -> AsyncIterator[tuple[AsyncClient, SyllabusService]]:
    from app.main import _build_app

    app = _build_app(get_settings())
    svc = _make_service()

    app.dependency_overrides[verify_id_token] = lambda: AuthenticatedUser(
        uid="alice", email="alice@example.com"
    )
    app.dependency_overrides[get_syllabus_service] = lambda: svc

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        async with app.router.lifespan_context(app):
            yield ac, svc


async def test_create_syllabus_api_success(api: tuple[AsyncClient, SyllabusService]) -> None:
    client, svc = api

    # Mock the LLM output in the fake service
    topic_tree_json = {
        "topics": [
            {
                "id": "1",
                "title": "Computer Networks",
                "description": "Basics of networking",
                "subtopics": [],
            }
        ]
    }
    svc._groq.completions.append(json.dumps(topic_tree_json))  # type: ignore[attr-defined]

    resp = await client.post(
        "/api/syllabus",
        json={"name": "Networks 101", "syllabus_text": "Sample syllabus text"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Networks 101"
    assert len(body["tree"]) == 1
    assert body["tree"][0]["id"] == "1"


async def test_create_syllabus_api_invalid_request(
    api: tuple[AsyncClient, SyllabusService],
) -> None:
    client, _ = api
    # Both provided
    resp = await client.post(
        "/api/syllabus",
        json={"name": "Bad", "syllabus_text": "text", "document_id": "doc-id"},
    )
    assert resp.status_code == 400


async def test_list_syllabi_api(api: tuple[AsyncClient, SyllabusService]) -> None:
    client, svc = api
    # Seed a syllabus
    s = Syllabus(
        id="s-1",
        user_id="alice",
        name="Security Class",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        tree=[],
    )
    await svc._syllabus_repo.create(s)

    resp = await client.get("/api/syllabus")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == "s-1"


async def test_get_syllabus_not_found(api: tuple[AsyncClient, SyllabusService]) -> None:
    client, _ = api
    resp = await client.get("/api/syllabus/not-here")
    assert resp.status_code == 404


async def test_delete_syllabus_api(api: tuple[AsyncClient, SyllabusService]) -> None:
    client, svc = api
    s = Syllabus(
        id="s-1",
        user_id="alice",
        name="Security Class",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        tree=[],
    )
    await svc._syllabus_repo.create(s)

    resp = await client.delete("/api/syllabus/s-1")
    assert resp.status_code == 204

    # Verify deleted
    resp_check = await client.get("/api/syllabus/s-1")
    assert resp_check.status_code == 404


async def test_coverage_api_endpoints(api: tuple[AsyncClient, SyllabusService]) -> None:
    client, svc = api
    s = Syllabus(
        id="s-1",
        user_id="alice",
        name="Security Class",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        tree=[Topic(id="l1", title="Title", description="Desc", subtopics=[])],
    )
    await svc._syllabus_repo.create(s)

    # Seed mock Qdrant chunks to avoid zero-chunk short-circuit
    from app.models.rag import RetrievedChunk

    svc._qdrant_repo._chunks = [  # type: ignore[attr-defined]
        RetrievedChunk(
            document_id="doc-1",
            document_filename="notes.pdf",
            page_number=1,
            chunk_index=0,
            text="Mock notes chunk text",
            score=0.9,
        )
    ]

    # Set up LLM mock for compute_coverage
    grade_json = {
        "score": 85.0,
        "status": "good",
        "explanation": "Great coverage.",
    }
    svc._groq.completions.append(json.dumps(grade_json))  # type: ignore[attr-defined]

    # Compute coverage using query params to override weights so combined score = llm_grade
    resp_compute = await client.post(
        "/api/syllabus/s-1/coverage?retrieval_weight=0.0&llm_weight=1.0"
    )
    assert resp_compute.status_code == 200
    body = resp_compute.json()
    assert body["syllabus_id"] == "s-1"
    assert body["topics"]["l1"]["score"] == 85.0

    # Get coverage
    resp_get = await client.get("/api/syllabus/s-1/coverage")
    assert resp_get.status_code == 200
    assert resp_get.json()["overall_score"] == 85.0
