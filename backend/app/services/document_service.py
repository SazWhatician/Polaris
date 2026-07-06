"""Document orchestration: ties the storage signing layer to Firestore persistence.

Routes call this. This module knows nothing about HTTP."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.document import (
    ALLOWED_MIME_TYPES,
    Document,
    DocumentCreateRequest,
    DocumentCreateResponse,
    DocumentStatus,
)
from app.repositories.document_repo import DocumentRepository
from app.services.status_transition import InvalidTransitionError, assert_transition
from app.services.storage_service import StorageService
from app.services.task_queue import TaskQueue

if TYPE_CHECKING:
    from app.repositories.qdrant_repo import QdrantRepository

log = get_logger(__name__)


class DocumentNotFoundError(Exception):
    pass


class DocumentValidationError(Exception):
    pass


class DocumentNotUploadedError(Exception):
    pass


OCR_TASK_NAME = "ocr_document"


class DocumentService:
    def __init__(
        self,
        repo: DocumentRepository,
        storage: StorageService,
        *,
        task_queue: TaskQueue,
        signed_url_ttl_seconds: int,
        max_upload_bytes: int,
        qdrant_repo: QdrantRepository | None = None,
    ) -> None:
        self._repo = repo
        self._storage = storage
        self._task_queue = task_queue
        self._ttl = signed_url_ttl_seconds
        self._max_bytes = max_upload_bytes
        self._qdrant_repo = qdrant_repo

    async def request_upload(
        self, user_id: str, request: DocumentCreateRequest
    ) -> DocumentCreateResponse:
        self._validate_upload(request)

        doc_id = uuid.uuid4().hex
        storage_path = f"users/{user_id}/{doc_id}/{request.filename}"
        now = datetime.now(UTC)

        auth = await self._storage.authorize_upload(
            storage_path=storage_path,
            mime_type=request.mime_type,
            ttl_seconds=self._ttl,
        )

        doc = Document(
            id=doc_id,
            user_id=user_id,
            filename=request.filename,
            mime_type=request.mime_type,
            size_bytes=request.size_bytes,
            status=DocumentStatus.REQUESTED,
            storage_path=storage_path,
            content_hash=None,
            error=None,
            created_at=now,
            updated_at=now,
        )
        await self._repo.create(doc)
        log.info("document.upload_requested", user_id=user_id, document_id=doc_id)

        return DocumentCreateResponse(
            document_id=doc_id,
            upload_url=auth.upload_url,
            storage_path=auth.storage_path,
            expires_in_seconds=auth.expires_in_seconds,
            required_headers=auth.required_headers,
        )

    async def finalize_upload(self, user_id: str, doc_id: str) -> Document:
        doc = await self._require_owned(user_id, doc_id)
        if not await self._storage.blob_exists(doc.storage_path):
            raise DocumentNotUploadedError(doc_id)

        assert_transition(doc.status, DocumentStatus.UPLOADED)
        actual_size = await self._storage.get_blob_size(doc.storage_path)
        extra = {"size_bytes": actual_size} if actual_size is not None else {}
        await self._repo.update_status(user_id, doc_id, DocumentStatus.UPLOADED, **extra)
        log.info("document.finalized", user_id=user_id, document_id=doc_id, size=actual_size)

        # Hand off to the OCR worker. We update status to QUEUED *after* the
        # enqueue succeeds so a Redis outage leaves the doc in UPLOADED
        # (visible in dashboard as "needs reprocess") rather than QUEUED forever.
        job_id = await self._task_queue.enqueue(OCR_TASK_NAME, user_id, doc_id)
        log.info(
            "document.ocr_enqueued",
            user_id=user_id,
            document_id=doc_id,
            job_id=job_id,
        )
        return await self._repo.update_status(user_id, doc_id, DocumentStatus.QUEUED)

    async def reprocess(self, user_id: str, doc_id: str) -> Document:
        doc = await self._require_owned(user_id, doc_id)
        try:
            assert_transition(doc.status, DocumentStatus.QUEUED)
        except InvalidTransitionError as exc:
            raise DocumentValidationError(str(exc)) from exc

        job_id = await self._task_queue.enqueue(OCR_TASK_NAME, user_id, doc_id)
        log.info(
            "document.reprocess",
            user_id=user_id,
            document_id=doc_id,
            job_id=job_id,
        )
        return await self._repo.update_status(
            user_id,
            doc_id,
            DocumentStatus.QUEUED,
            error=None,
        )

    async def list_documents(self, user_id: str, limit: int) -> list[Document]:
        return await self._repo.list(user_id, limit=limit)

    async def delete_document(self, user_id: str, doc_id: str) -> None:
        doc = await self._require_owned(user_id, doc_id)
        # Best-effort cleanup across all data stores. We continue past failures
        # so a single broken backend can't orphan the user's metadata forever.
        try:
            await self._storage.delete_blob(doc.storage_path)
        except Exception as exc:  # noqa: BLE001
            log.warning(
                "document.delete.blob_failed",
                user_id=user_id,
                document_id=doc_id,
                error=str(exc),
            )
        if self._qdrant_repo is not None:
            try:
                await self._qdrant_repo.delete_for_document(
                    user_id=user_id,
                    document_id=doc_id,
                )
            except Exception as exc:  # noqa: BLE001
                log.warning(
                    "document.delete.qdrant_failed",
                    user_id=user_id,
                    document_id=doc_id,
                    error=str(exc),
                )
        await self._repo.delete(user_id, doc_id)
        log.info("document.deleted", user_id=user_id, document_id=doc_id)

    # ------- helpers -------

    async def _require_owned(self, user_id: str, doc_id: str) -> Document:
        doc = await self._repo.get(user_id, doc_id)
        if doc is None:
            raise DocumentNotFoundError(doc_id)
        # Path-scoped read already enforces ownership, but assert for defense in depth.
        if doc.user_id != user_id:
            raise DocumentNotFoundError(doc_id)
        return doc

    def _validate_upload(self, req: DocumentCreateRequest) -> None:
        if req.mime_type not in ALLOWED_MIME_TYPES:
            raise DocumentValidationError(f"Unsupported mime type: {req.mime_type}")
        if req.size_bytes > self._max_bytes:
            raise DocumentValidationError(f"File too large: {req.size_bytes} > {self._max_bytes}")
        if "/" in req.filename or "\\" in req.filename or req.filename.startswith("."):
            raise DocumentValidationError("Invalid filename")
