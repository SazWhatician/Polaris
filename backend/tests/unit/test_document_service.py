"""Unit tests for DocumentService using in-memory fakes.

These do NOT touch Firestore or Firebase Storage. Integration tests against
the Firestore emulator come in a later phase when the test infra warrants it.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import pytest
from app.models.document import (
    Document,
    DocumentCreateRequest,
    DocumentStatus,
)
from app.services.document_service import (
    DocumentNotFoundError,
    DocumentNotUploadedError,
    DocumentService,
    DocumentValidationError,
)
from app.services.storage_service import UploadAuthorization


class FakeRepo:
    def __init__(self) -> None:
        self.docs: dict[tuple[str, str], Document] = {}

    async def create(self, doc: Document) -> Document:
        self.docs[(doc.user_id, doc.id)] = doc
        return doc

    async def get(self, user_id: str, doc_id: str) -> Document | None:
        return self.docs.get((user_id, doc_id))

    async def list(self, user_id: str, *, limit: int) -> list[Document]:
        items = [d for (uid, _), d in self.docs.items() if uid == user_id]
        items.sort(key=lambda d: d.created_at, reverse=True)
        return items[:limit]

    async def update_status(
        self,
        user_id: str,
        doc_id: str,
        status: DocumentStatus,
        **extra: Any,
    ) -> Document:
        doc = self.docs[(user_id, doc_id)]
        updates = {"status": status, "updated_at": datetime.now(UTC), **extra}
        new = doc.model_copy(update=updates)
        self.docs[(user_id, doc_id)] = new
        return new

    async def delete(self, user_id: str, doc_id: str) -> None:
        self.docs.pop((user_id, doc_id), None)


@dataclass
class FakeStorage:
    existing_blobs: set[str]
    sizes: dict[str, int]
    deleted: list[str]

    async def authorize_upload(
        self,
        *,
        storage_path: str,
        mime_type: str,
        ttl_seconds: int,
    ) -> UploadAuthorization:
        return UploadAuthorization(
            upload_url=f"https://fake-signed/{storage_path}",
            storage_path=storage_path,
            expires_in_seconds=ttl_seconds,
            required_headers={"Content-Type": mime_type},
        )

    async def blob_exists(self, storage_path: str) -> bool:
        return storage_path in self.existing_blobs

    async def get_blob_size(self, storage_path: str) -> int | None:
        return self.sizes.get(storage_path)

    async def delete_blob(self, storage_path: str) -> None:
        self.deleted.append(storage_path)


class FakeTaskQueue:
    def __init__(self) -> None:
        self.enqueued: list[tuple[str, tuple[Any, ...]]] = []

    async def enqueue(self, function_name: str, *args: Any, **_kwargs: Any) -> str | None:
        self.enqueued.append((function_name, args))
        return f"fake-job-{len(self.enqueued)}"


@pytest.fixture
def service() -> tuple[DocumentService, FakeRepo, FakeStorage, FakeTaskQueue]:
    repo = FakeRepo()
    storage = FakeStorage(existing_blobs=set(), sizes={}, deleted=[])
    queue = FakeTaskQueue()
    svc = DocumentService(
        repo=repo,  # type: ignore[arg-type]
        storage=storage,  # type: ignore[arg-type]
        task_queue=queue,
        signed_url_ttl_seconds=600,
        max_upload_bytes=10 * 1024 * 1024,
    )
    return svc, repo, storage, queue


async def test_request_upload_creates_doc_and_returns_signed_url(service: Any) -> None:
    svc, repo, _, _ = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="notes.pdf", mime_type="application/pdf", size_bytes=2048),
    )
    assert resp.upload_url.startswith("https://fake-signed/users/alice/")
    assert resp.required_headers == {"Content-Type": "application/pdf"}

    stored = await repo.get("alice", resp.document_id)
    assert stored is not None
    assert stored.status == DocumentStatus.REQUESTED
    assert stored.user_id == "alice"
    assert stored.storage_path == f"users/alice/{resp.document_id}/notes.pdf"


async def test_request_upload_rejects_disallowed_mime(service: Any) -> None:
    svc, *_rest = service
    with pytest.raises(DocumentValidationError):
        await svc.request_upload(
            "alice",
            DocumentCreateRequest(
                filename="x.exe", mime_type="application/octet-stream", size_bytes=100
            ),
        )


async def test_request_upload_rejects_oversize(service: Any) -> None:
    svc, *_rest = service
    with pytest.raises(DocumentValidationError):
        await svc.request_upload(
            "alice",
            DocumentCreateRequest(
                filename="big.pdf", mime_type="application/pdf", size_bytes=999_999_999
            ),
        )


async def test_request_upload_rejects_path_traversal_filename(service: Any) -> None:
    svc, *_rest = service
    with pytest.raises(DocumentValidationError):
        await svc.request_upload(
            "alice",
            DocumentCreateRequest(
                filename="../etc/passwd", mime_type="application/pdf", size_bytes=10
            ),
        )


async def test_finalize_requires_blob_present(service: Any) -> None:
    svc, *_rest = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    with pytest.raises(DocumentNotUploadedError):
        await svc.finalize_upload("alice", resp.document_id)


async def test_finalize_marks_uploaded_then_queued_and_enqueues_ocr(service: Any) -> None:
    svc, _repo, storage, queue = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    storage.existing_blobs.add(resp.storage_path)
    storage.sizes[resp.storage_path] = 4096

    finalized = await svc.finalize_upload("alice", resp.document_id)
    assert finalized.status == DocumentStatus.QUEUED
    assert finalized.size_bytes == 4096
    assert queue.enqueued == [("ocr_document", ("alice", resp.document_id))]


async def test_reprocess_requeues_failed_doc(service: Any) -> None:
    svc, repo, storage, queue = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    storage.existing_blobs.add(resp.storage_path)
    storage.sizes[resp.storage_path] = 4096
    await svc.finalize_upload("alice", resp.document_id)
    # Simulate worker failure.
    await repo.update_status("alice", resp.document_id, DocumentStatus.FAILED, error="boom")

    requeued = await svc.reprocess("alice", resp.document_id)
    assert requeued.status == DocumentStatus.QUEUED
    assert requeued.error is None
    assert len(queue.enqueued) == 2


async def test_reprocess_rejects_invalid_state(service: Any) -> None:
    from app.services.document_service import DocumentValidationError

    svc, *_rest = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    # Status is REQUESTED — REQUESTED → QUEUED is not a valid transition.
    with pytest.raises(DocumentValidationError):
        await svc.reprocess("alice", resp.document_id)


async def test_list_returns_only_callers_docs(service: Any) -> None:
    svc, *_rest = service
    await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="a.pdf", mime_type="application/pdf", size_bytes=10),
    )
    await svc.request_upload(
        "bob",
        DocumentCreateRequest(filename="b.pdf", mime_type="application/pdf", size_bytes=10),
    )
    alice_docs = await svc.list_documents("alice", limit=10)
    assert len(alice_docs) == 1
    assert alice_docs[0].filename == "a.pdf"


async def test_delete_removes_blob_and_record(
    service: tuple[DocumentService, FakeRepo, FakeStorage, FakeTaskQueue],
) -> None:
    svc, repo, storage, _ = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    storage.existing_blobs.add(resp.storage_path)

    await svc.delete_document("alice", resp.document_id)
    assert resp.storage_path in storage.deleted
    assert await repo.get("alice", resp.document_id) is None


async def test_delete_other_users_doc_404s(
    service: tuple[DocumentService, FakeRepo, FakeStorage, FakeTaskQueue],
) -> None:
    svc, *_ = service
    resp = await svc.request_upload(
        "alice",
        DocumentCreateRequest(filename="n.pdf", mime_type="application/pdf", size_bytes=10),
    )
    with pytest.raises(DocumentNotFoundError):
        await svc.delete_document("bob", resp.document_id)
