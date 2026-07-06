"""Tests OcrService with fake repos + fake OCR engine.

We monkeypatch ``extract_pages`` so this test never touches pypdfium2 or PIL —
the engine and the extraction are isolated and tested separately."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest
from app.models.document import Document, DocumentStatus, Page
from app.services.ocr_service import (
    DocumentNotFoundError,
    OcrService,
    PageOcrResult,
)
from app.services.status_transition import InvalidTransitionError


class FakeDocRepo:
    def __init__(self, docs: dict[tuple[str, str], Document]) -> None:
        self.docs = docs
        self.updates: list[tuple[str, str, DocumentStatus, dict[str, Any]]] = []

    async def get(self, user_id: str, doc_id: str) -> Document | None:
        return self.docs.get((user_id, doc_id))

    async def update_status(
        self, user_id: str, doc_id: str, status: DocumentStatus, **extra: Any
    ) -> Document:
        self.updates.append((user_id, doc_id, status, dict(extra)))
        doc = self.docs[(user_id, doc_id)]
        updates: dict[str, Any] = {"status": status, "updated_at": datetime.now(UTC), **extra}
        new = doc.model_copy(update=updates)
        self.docs[(user_id, doc_id)] = new
        return new


class FakePageRepo:
    def __init__(self) -> None:
        self.written: list[tuple[str, str, list[Page]]] = []

    async def write_pages(self, user_id: str, document_id: str, pages: list[Page]) -> None:
        self.written.append((user_id, document_id, list(pages)))


class FakeStorage:
    def __init__(self, blob_data: dict[str, bytes]) -> None:
        self.blob_data = blob_data

    async def download_bytes(self, storage_path: str) -> bytes:
        return self.blob_data[storage_path]


class FakeEngine:
    name: str = "fake-engine-1.0"

    def __init__(self, *, fail_on_page: int | None = None) -> None:
        self.calls = 0
        self.fail_on_page = fail_on_page

    def ocr_image(self, _image: Any) -> PageOcrResult:
        self.calls += 1
        if self.fail_on_page is not None and self.calls == self.fail_on_page:
            raise RuntimeError(f"simulated OCR failure on page {self.calls}")
        return PageOcrResult(text=f"text-page-{self.calls}", confidence=0.9)


def _make_doc(
    *,
    status: DocumentStatus = DocumentStatus.QUEUED,
    content_hash: str | None = None,
) -> Document:
    now = datetime.now(UTC)
    return Document(
        id="doc-1",
        user_id="alice",
        filename="n.pdf",
        mime_type="application/pdf",
        size_bytes=100,
        status=status,
        storage_path="users/alice/doc-1/n.pdf",
        content_hash=content_hash,
        created_at=now,
        updated_at=now,
    )


def _make_service(
    *,
    docs: dict[tuple[str, str], Document],
    blob_data: dict[str, bytes],
    engine: FakeEngine,
) -> tuple[OcrService, FakeDocRepo, FakePageRepo, FakeStorage]:
    doc_repo = FakeDocRepo(docs)
    page_repo = FakePageRepo()
    storage = FakeStorage(blob_data)
    svc = OcrService(
        doc_repo=doc_repo,  # type: ignore[arg-type]
        page_repo=page_repo,  # type: ignore[arg-type]
        storage=storage,  # type: ignore[arg-type]
        engine=engine,
        max_pages=10,
        render_scale=1.0,
    )
    return svc, doc_repo, page_repo, storage


def _patch_extract(monkeypatch: pytest.MonkeyPatch, page_count: int) -> None:
    # Return sentinel "image" objects; FakeEngine ignores them.
    monkeypatch.setattr(
        "app.services.ocr_service.extract_pages",
        lambda _blob, _mime, *, render_scale: [object() for _ in range(page_count)],
    )


async def test_happy_path_persists_pages_and_marks_complete(monkeypatch) -> None:
    doc = _make_doc(status=DocumentStatus.QUEUED)
    svc, doc_repo, page_repo, _ = _make_service(
        docs={("alice", "doc-1"): doc},
        blob_data={"users/alice/doc-1/n.pdf": b"fake-pdf-bytes"},
        engine=FakeEngine(),
    )
    _patch_extract(monkeypatch, page_count=3)

    result = await svc.process("alice", "doc-1")

    assert result["page_count"] == 3
    assert isinstance(result["content_hash"], str) and len(result["content_hash"]) == 64
    assert len(page_repo.written) == 1
    user_id, doc_id, pages = page_repo.written[0]
    assert user_id == "alice"
    assert doc_id == "doc-1"
    assert [p.page_number for p in pages] == [1, 2, 3]

    final_doc = doc_repo.docs[("alice", "doc-1")]
    assert final_doc.status == DocumentStatus.OCR_COMPLETE
    assert final_doc.page_count == 3
    assert final_doc.content_hash is not None


async def test_idempotent_short_circuit_when_hash_unchanged(monkeypatch) -> None:
    import hashlib

    blob = b"identical-bytes"
    hashed = hashlib.sha256(blob).hexdigest()
    doc = _make_doc(status=DocumentStatus.OCR_COMPLETE, content_hash=hashed)

    svc, _doc_repo, page_repo, _ = _make_service(
        docs={("alice", "doc-1"): doc},
        blob_data={"users/alice/doc-1/n.pdf": blob},
        engine=FakeEngine(),
    )
    _patch_extract(monkeypatch, page_count=3)

    result = await svc.process("alice", "doc-1")

    assert result == {"skipped": True, "reason": "unchanged", "content_hash": hashed}
    assert page_repo.written == []  # no re-write


async def test_worker_refuses_to_process_doc_not_in_queued_state(monkeypatch) -> None:
    """Even when the content hash differs, the worker won't sneak through a
    bypass of the reprocess endpoint — it expects the doc to be in QUEUED.
    Documents the invariant: state transitions go through the document service."""
    doc = _make_doc(status=DocumentStatus.OCR_COMPLETE, content_hash="old-hash")
    svc, _doc_repo, _page_repo, _ = _make_service(
        docs={("alice", "doc-1"): doc},
        blob_data={"users/alice/doc-1/n.pdf": b"new-bytes"},
        engine=FakeEngine(),
    )
    _patch_extract(monkeypatch, page_count=2)

    with pytest.raises(InvalidTransitionError):
        await svc.process("alice", "doc-1")


async def test_failure_marks_doc_failed_and_re_raises(monkeypatch) -> None:
    doc = _make_doc(status=DocumentStatus.QUEUED)
    svc, doc_repo, _page_repo, _ = _make_service(
        docs={("alice", "doc-1"): doc},
        blob_data={"users/alice/doc-1/n.pdf": b"any"},
        engine=FakeEngine(fail_on_page=2),
    )
    _patch_extract(monkeypatch, page_count=3)

    with pytest.raises(RuntimeError, match="simulated OCR failure"):
        await svc.process("alice", "doc-1")

    final = doc_repo.docs[("alice", "doc-1")]
    assert final.status == DocumentStatus.FAILED
    assert final.error is not None
    assert "simulated OCR failure" in final.error


async def test_too_many_pages_rejected(monkeypatch) -> None:
    doc = _make_doc(status=DocumentStatus.QUEUED)
    svc, doc_repo, _page_repo, _ = _make_service(
        docs={("alice", "doc-1"): doc},
        blob_data={"users/alice/doc-1/n.pdf": b"x"},
        engine=FakeEngine(),
    )
    _patch_extract(monkeypatch, page_count=99)  # > max_pages=10

    with pytest.raises(ValueError, match="exceeds limit"):
        await svc.process("alice", "doc-1")
    assert doc_repo.docs[("alice", "doc-1")].status == DocumentStatus.FAILED


async def test_missing_document_raises() -> None:
    svc, *_ = _make_service(
        docs={},
        blob_data={},
        engine=FakeEngine(),
    )
    with pytest.raises(DocumentNotFoundError):
        await svc.process("alice", "missing")
