"""Firestore data access for documents.

Only this module touches Firestore for documents. Services call methods here.
Path convention: users/{uid}/documents/{doc_id}.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1 import DocumentSnapshot

from app.models.document import Document, DocumentStatus

_COLLECTION = "documents"


class DocumentRepository:
    def __init__(self, client: FirestoreClient) -> None:
        self._client = client

    # ------- public API (async; wrap sync Firestore in to_thread) -------

    async def create(self, doc: Document) -> Document:
        await asyncio.to_thread(self._create_sync, doc)
        return doc

    async def get(self, user_id: str, doc_id: str) -> Document | None:
        snap = await asyncio.to_thread(self._get_sync, user_id, doc_id)
        return _from_snapshot(snap) if snap and snap.exists else None

    async def list(self, user_id: str, *, limit: int) -> list[Document]:
        snaps = await asyncio.to_thread(self._list_sync, user_id, limit)
        return [_from_snapshot(s) for s in snaps]

    async def update_status(
        self,
        user_id: str,
        doc_id: str,
        status: DocumentStatus,
        **extra_fields: Any,
    ) -> Document:
        await asyncio.to_thread(self._update_status_sync, user_id, doc_id, status, extra_fields)
        result = await self.get(user_id, doc_id)
        if result is None:
            raise KeyError(f"Document {doc_id} disappeared after update")
        return result

    async def delete(self, user_id: str, doc_id: str) -> None:
        await asyncio.to_thread(self._delete_sync, user_id, doc_id)

    # ------- sync internals -------

    def _user_col(self, user_id: str) -> Any:
        return self._client.collection("users").document(user_id).collection(_COLLECTION)

    def _create_sync(self, doc: Document) -> None:
        self._user_col(doc.user_id).document(doc.id).set(_to_firestore(doc))

    def _get_sync(self, user_id: str, doc_id: str) -> DocumentSnapshot:
        return self._user_col(user_id).document(doc_id).get()

    def _list_sync(self, user_id: str, limit: int) -> list[DocumentSnapshot]:
        from google.cloud.firestore_v1 import Query

        query = (
            self._user_col(user_id).order_by("created_at", direction=Query.DESCENDING).limit(limit)
        )
        return list(query.stream())

    def _update_status_sync(
        self,
        user_id: str,
        doc_id: str,
        status: DocumentStatus,
        extra: dict[str, Any],
    ) -> None:
        payload: dict[str, Any] = {
            "status": status.value,
            "updated_at": datetime.now(UTC),
            **extra,
        }
        self._user_col(user_id).document(doc_id).update(payload)

    def _delete_sync(self, user_id: str, doc_id: str) -> None:
        self._user_col(user_id).document(doc_id).delete()


# ------- (de)serialization helpers -------


def _to_firestore(doc: Document) -> dict[str, Any]:
    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "filename": doc.filename,
        "mime_type": doc.mime_type,
        "size_bytes": doc.size_bytes,
        "status": doc.status.value,
        "storage_path": doc.storage_path,
        "content_hash": doc.content_hash,
        "page_count": doc.page_count,
        "ocr_completed_at": doc.ocr_completed_at,
        "error": doc.error,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
    }


def _from_snapshot(snap: DocumentSnapshot) -> Document:
    data = snap.to_dict() or {}
    return Document(
        id=data["id"],
        user_id=data["user_id"],
        filename=data["filename"],
        mime_type=data["mime_type"],
        size_bytes=int(data["size_bytes"]),
        status=DocumentStatus(data["status"]),
        storage_path=data["storage_path"],
        content_hash=data.get("content_hash"),
        page_count=data.get("page_count"),
        ocr_completed_at=data.get("ocr_completed_at"),
        error=data.get("error"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
    )
