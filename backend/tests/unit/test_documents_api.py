"""API-level tests for /api/documents using FastAPI dependency overrides.

We bypass real Firebase by overriding the auth dependency + the service
factory. This exercises routing, response shapes, status codes, error mapping —
without needing a network or emulator.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from app.api.documents import get_document_service
from app.core.config import get_settings
from app.core.deps import verify_id_token
from app.models.user import AuthenticatedUser
from app.services.document_service import (
    DocumentService,
)
from httpx import ASGITransport, AsyncClient

from tests.unit.test_document_service import FakeRepo, FakeStorage, FakeTaskQueue


class _Svc(DocumentService):
    """Subclass so we keep DocumentService type but inject fakes."""


def _make_service() -> DocumentService:
    repo = FakeRepo()
    storage = FakeStorage(existing_blobs=set(), sizes={}, deleted=[])
    queue = FakeTaskQueue()
    return _Svc(
        repo=repo,  # type: ignore[arg-type]
        storage=storage,  # type: ignore[arg-type]
        task_queue=queue,
        signed_url_ttl_seconds=600,
        max_upload_bytes=10 * 1024 * 1024,
    )


@pytest.fixture
async def api() -> AsyncIterator[tuple[AsyncClient, DocumentService]]:
    from app.main import _build_app

    app = _build_app(get_settings())
    svc = _make_service()

    app.dependency_overrides[verify_id_token] = lambda: AuthenticatedUser(
        uid="alice", email="a@x.com"
    )
    app.dependency_overrides[get_document_service] = lambda: svc

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        async with app.router.lifespan_context(app):
            yield ac, svc


async def test_request_upload_201_and_returns_signed_url(
    api: tuple[AsyncClient, DocumentService],
) -> None:
    client, _ = api
    resp = await client.post(
        "/api/documents",
        json={"filename": "n.pdf", "mime_type": "application/pdf", "size_bytes": 100},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["upload_url"].startswith("https://fake-signed/users/alice/")
    assert body["required_headers"] == {"Content-Type": "application/pdf"}


async def test_request_upload_400_on_invalid_mime(
    api: tuple[AsyncClient, DocumentService],
) -> None:
    client, _ = api
    resp = await client.post(
        "/api/documents",
        json={"filename": "x.exe", "mime_type": "application/octet-stream", "size_bytes": 1},
    )
    assert resp.status_code == 400


async def test_finalize_409_when_blob_missing(api: tuple[AsyncClient, DocumentService]) -> None:
    client, _ = api
    r1 = await client.post(
        "/api/documents",
        json={"filename": "n.pdf", "mime_type": "application/pdf", "size_bytes": 10},
    )
    doc_id = r1.json()["document_id"]
    r2 = await client.post(f"/api/documents/{doc_id}/finalize")
    assert r2.status_code == 409


async def test_finalize_404_for_unknown_doc(api: tuple[AsyncClient, DocumentService]) -> None:
    client, _ = api
    resp = await client.post("/api/documents/does-not-exist/finalize")
    assert resp.status_code == 404


async def test_list_returns_only_callers_docs(api: tuple[AsyncClient, DocumentService]) -> None:
    client, _ = api
    await client.post(
        "/api/documents",
        json={"filename": "a.pdf", "mime_type": "application/pdf", "size_bytes": 10},
    )
    resp = await client.get("/api/documents")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["filename"] == "a.pdf"


async def test_delete_204_then_list_empty(api: tuple[AsyncClient, DocumentService]) -> None:
    client, svc = api
    r1 = await client.post(
        "/api/documents",
        json={"filename": "n.pdf", "mime_type": "application/pdf", "size_bytes": 10},
    )
    doc_id = r1.json()["document_id"]
    # mark blob as existing so delete attempts the storage call too
    svc._storage.existing_blobs.add(r1.json()["storage_path"])  # type: ignore[attr-defined]

    r2 = await client.delete(f"/api/documents/{doc_id}")
    assert r2.status_code == 204
    r3 = await client.get("/api/documents")
    assert r3.json()["items"] == []
