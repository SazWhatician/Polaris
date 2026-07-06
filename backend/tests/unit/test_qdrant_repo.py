"""Mocks AsyncQdrantClient. The key invariant we test: every search MUST
include a `user_id` filter in the `must` clause. If that ever regresses,
this test fails and Phase 1's multi-tenant promise breaks."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from app.models.rag import Chunk
from app.repositories.qdrant_repo import QdrantRepository


def _make_repo() -> tuple[QdrantRepository, AsyncMock]:
    client = AsyncMock()
    repo = QdrantRepository(client, collection="test-coll", vector_dim=4)
    return repo, client


async def test_search_always_includes_user_id_filter() -> None:
    repo, client = _make_repo()
    client.search.return_value = []

    await repo.search(user_id="alice", query_vector=[0.1] * 4, top_k=3)

    client.search.assert_awaited_once()
    call_kwargs = client.search.call_args.kwargs
    must = call_kwargs["query_filter"].must
    # The user_id condition must be present, period.
    assert any(
        getattr(c, "key", None) == "user_id" and getattr(c.match, "value", None) == "alice"
        for c in must
    )


async def test_search_adds_document_filter_when_scoped() -> None:
    repo, client = _make_repo()
    client.search.return_value = []

    await repo.search(
        user_id="alice",
        query_vector=[0.1] * 4,
        top_k=3,
        document_ids=["d1", "d2"],
    )

    must = client.search.call_args.kwargs["query_filter"].must
    assert any(getattr(c, "key", None) == "document_id" for c in must)


async def test_search_returns_retrieved_chunks_with_score() -> None:
    repo, client = _make_repo()
    client.search.return_value = [
        SimpleNamespace(
            score=0.87,
            payload={
                "user_id": "alice",
                "document_id": "d1",
                "document_filename": "notes.pdf",
                "page_number": 3,
                "chunk_index": 0,
                "text": "TCP uses a three-way handshake.",
            },
        ),
    ]

    chunks = await repo.search(user_id="alice", query_vector=[0.1] * 4, top_k=3)
    assert len(chunks) == 1
    assert chunks[0].score == pytest.approx(0.87)
    assert chunks[0].text.startswith("TCP")


async def test_upsert_writes_payload_with_user_scope() -> None:
    repo, client = _make_repo()
    chunks = [
        Chunk(document_id="d1", page_number=1, chunk_index=0, text="hello"),
        Chunk(document_id="d1", page_number=1, chunk_index=1, text="world"),
    ]
    await repo.upsert_chunks(
        user_id="alice",
        document_id="d1",
        document_filename="notes.pdf",
        chunks=chunks,
        vectors=[[0.1] * 4, [0.2] * 4],
    )
    client.upsert.assert_awaited_once()
    points = client.upsert.call_args.kwargs["points"]
    assert len(points) == 2
    for p in points:
        assert p.payload["user_id"] == "alice"
        assert p.payload["document_id"] == "d1"
        assert p.payload["document_filename"] == "notes.pdf"


async def test_delete_filters_on_user_and_document() -> None:
    repo, client = _make_repo()
    await repo.delete_for_document(user_id="alice", document_id="d1")
    client.delete.assert_awaited_once()
    selector = client.delete.call_args.kwargs["points_selector"]
    must = selector.filter.must
    keys = {c.key for c in must}
    assert keys == {"user_id", "document_id"}


async def test_upsert_with_mismatched_lengths_raises() -> None:
    repo, _ = _make_repo()
    with pytest.raises(ValueError):
        await repo.upsert_chunks(
            user_id="alice",
            document_id="d1",
            document_filename="x",
            chunks=[Chunk(document_id="d1", page_number=1, chunk_index=0, text="hi")],
            vectors=[[0.1] * 4, [0.2] * 4],  # length mismatch
        )
