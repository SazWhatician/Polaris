"""Firestore access for per-page OCR text under
users/{uid}/documents/{docId}/pages/{pageNum}."""

from __future__ import annotations

import asyncio
from typing import Any

from google.cloud.firestore import Client as FirestoreClient
from google.cloud.firestore_v1 import DocumentSnapshot

from app.models.document import Page


class PageRepository:
    def __init__(self, client: FirestoreClient) -> None:
        self._client = client

    async def write_pages(self, user_id: str, document_id: str, pages: list[Page]) -> None:
        """Atomic-ish overwrite: deletes existing pages then writes all new ones in batches.

        Firestore batch limit is 500 ops; we chunk accordingly.
        """
        await asyncio.to_thread(self._write_pages_sync, user_id, document_id, pages)

    async def list_pages(self, user_id: str, document_id: str) -> list[Page]:
        snaps = await asyncio.to_thread(self._list_sync, user_id, document_id)
        return [_from_snapshot(s) for s in snaps]

    async def delete_all(self, user_id: str, document_id: str) -> None:
        await asyncio.to_thread(self._delete_all_sync, user_id, document_id)

    # --- sync internals ---

    def _pages_col(self, user_id: str, document_id: str) -> Any:
        return (
            self._client.collection("users")
            .document(user_id)
            .collection("documents")
            .document(document_id)
            .collection("pages")
        )

    def _write_pages_sync(self, user_id: str, document_id: str, pages: list[Page]) -> None:
        self._delete_all_sync(user_id, document_id)
        col = self._pages_col(user_id, document_id)
        batch = self._client.batch()
        count = 0
        for page in pages:
            doc_id = f"{page.page_number:05d}"
            batch.set(col.document(doc_id), _to_firestore(page))
            count += 1
            if count % 400 == 0:  # leave headroom below 500 limit
                batch.commit()
                batch = self._client.batch()
        if count % 400 != 0:
            batch.commit()

    def _list_sync(self, user_id: str, document_id: str) -> list[DocumentSnapshot]:
        from google.cloud.firestore_v1 import Query

        query = self._pages_col(user_id, document_id).order_by(
            "page_number", direction=Query.ASCENDING
        )
        return list(query.stream())

    def _delete_all_sync(self, user_id: str, document_id: str) -> None:
        col = self._pages_col(user_id, document_id)
        batch = self._client.batch()
        count = 0
        for snap in col.stream():
            batch.delete(snap.reference)
            count += 1
            if count % 400 == 0:
                batch.commit()
                batch = self._client.batch()
        if count > 0 and count % 400 != 0:
            batch.commit()


def _to_firestore(page: Page) -> dict[str, Any]:
    return {
        "document_id": page.document_id,
        "page_number": page.page_number,
        "text": page.text,
        "confidence": page.confidence,
        "ocr_engine": page.ocr_engine,
        "processed_at": page.processed_at,
    }


def _from_snapshot(snap: DocumentSnapshot) -> Page:
    data = snap.to_dict() or {}
    return Page(
        document_id=data["document_id"],
        page_number=int(data["page_number"]),
        text=data["text"],
        confidence=float(data["confidence"]),
        ocr_engine=data["ocr_engine"],
        processed_at=data["processed_at"],
    )
