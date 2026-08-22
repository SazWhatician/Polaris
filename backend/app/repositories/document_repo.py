"""Supabase PostgreSQL / Memory data access for documents."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any

from app.core.logging import get_logger
from app.core.supabase import get_supabase_client
from app.models.document import Document, DocumentStatus

log = get_logger(__name__)

_mem_docs: dict[tuple[str, str], Document] = {}


class DocumentRepository:
    def __init__(self, client: Any = None) -> None:
        self._client = client

    def _get_sb_table(self) -> Any:
        sb = get_supabase_client()
        if sb is not None:
            try:
                return sb.table("documents")
            except Exception:
                pass
        return None

    # ------- public API (async) -------

    async def create(self, doc: Document) -> Document:
        _mem_docs[(doc.user_id, doc.id)] = doc
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                await asyncio.to_thread(
                    lambda: tbl.insert(_to_supabase_dict(doc)).execute()
                )
            except Exception as exc:
                log.warning("supabase.document_insert_fallback", error=str(exc))
        return doc

    async def get(self, user_id: str, doc_id: str) -> Document | None:
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                res = await asyncio.to_thread(
                    lambda: tbl.select("*").eq("user_id", user_id).eq("id", doc_id).execute()
                )
                if res.data and len(res.data) > 0:
                    doc = _from_supabase_dict(res.data[0])
                    _mem_docs[(user_id, doc_id)] = doc
                    return doc
            except Exception as exc:
                log.warning("supabase.document_get_fallback", error=str(exc))
        return _mem_docs.get((user_id, doc_id))

    async def list(self, user_id: str, *, limit: int) -> list[Document]:
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                res = await asyncio.to_thread(
                    lambda: tbl.select("*")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(limit)
                    .execute()
                )
                if res.data is not None:
                    docs = [_from_supabase_dict(row) for row in res.data]
                    for d in docs:
                        _mem_docs[(d.user_id, d.id)] = d
                    return docs
            except Exception as exc:
                log.warning("supabase.document_list_fallback", error=str(exc))

        items = [d for (uid, _), d in _mem_docs.items() if uid == user_id]
        items.sort(key=lambda d: d.created_at, reverse=True)
        return items[:limit]

    async def update_status(
        self,
        user_id: str,
        doc_id: str,
        status: DocumentStatus,
        **extra_fields: Any,
    ) -> Document:
        now = datetime.now(UTC)
        old = _mem_docs.get((user_id, doc_id))
        if old is None:
            old = await self.get(user_id, doc_id)

        if old is not None:
            new_doc = old.model_copy(update={"status": status, "updated_at": now, **extra_fields})
            _mem_docs[(user_id, doc_id)] = new_doc
        else:
            new_doc = Document(
                id=doc_id,
                user_id=user_id,
                filename="document",
                mime_type="application/pdf",
                size_bytes=int(extra_fields.get("size_bytes") or 1),
                status=status,
                storage_path=f"users/{user_id}/{doc_id}/document",
                created_at=now,
                updated_at=now,
                **extra_fields,
            )
            _mem_docs[(user_id, doc_id)] = new_doc

        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                payload = {
                    "status": status.value,
                    "updated_at": now.isoformat(),
                }
                for k, v in extra_fields.items():
                    if isinstance(v, datetime):
                        payload[k] = v.isoformat()
                    else:
                        payload[k] = v
                await asyncio.to_thread(
                    lambda: tbl.update(payload).eq("user_id", user_id).eq("id", doc_id).execute()
                )
            except Exception as exc:
                log.warning("supabase.document_update_fallback", error=str(exc))

        return _mem_docs[(user_id, doc_id)]

    async def delete(self, user_id: str, doc_id: str) -> None:
        _mem_docs.pop((user_id, doc_id), None)
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                await asyncio.to_thread(
                    lambda: tbl.delete().eq("user_id", user_id).eq("id", doc_id).execute()
                )
            except Exception as exc:
                log.warning("supabase.document_delete_fallback", error=str(exc))


# ------- (de)serialization helpers -------


def _to_supabase_dict(doc: Document) -> dict[str, Any]:
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
        "ocr_completed_at": doc.ocr_completed_at.isoformat() if doc.ocr_completed_at else None,
        "error": doc.error,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }


def _from_supabase_dict(data: dict[str, Any]) -> Document:
    created = data["created_at"]
    if isinstance(created, str):
        created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
    else:
        created_dt = created

    updated = data.get("updated_at")
    if isinstance(updated, str):
        updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
    else:
        updated_dt = updated or created_dt

    ocr_at = data.get("ocr_completed_at")
    ocr_dt = datetime.fromisoformat(ocr_at.replace("Z", "+00:00")) if isinstance(ocr_at, str) else ocr_at

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
        ocr_completed_at=ocr_dt,
        error=data.get("error"),
        created_at=created_dt,
        updated_at=updated_dt,
    )

