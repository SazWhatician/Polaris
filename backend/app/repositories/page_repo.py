"""Supabase PostgreSQL / Memory data access for per-page OCR text."""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from app.core.logging import get_logger
from app.core.supabase import get_supabase_client
from app.models.document import Page

log = get_logger(__name__)

_mem_pages: dict[tuple[str, str], list[Page]] = {}


class PageRepository:
    def __init__(self, client: Any = None) -> None:
        self._client = client

    def _get_sb_table(self) -> Any:
        sb = get_supabase_client()
        if sb is not None:
            try:
                return sb.table("pages")
            except Exception:
                pass
        return None

    async def write_pages(self, user_id: str, document_id: str, pages: list[Page]) -> None:
        _mem_pages[(user_id, document_id)] = pages
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                # Delete existing pages for this document first
                await asyncio.to_thread(
                    lambda: tbl.delete().eq("user_id", user_id).eq("document_id", document_id).execute()
                )
                if pages:
                    rows = [_to_supabase_page(p, user_id) for p in pages]
                    await asyncio.to_thread(lambda: tbl.insert(rows).execute())
            except Exception as exc:
                log.warning("supabase.page_insert_fallback", error=str(exc))

    async def list_pages(self, user_id: str, document_id: str) -> list[Page]:
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                res = await asyncio.to_thread(
                    lambda: tbl.select("*")
                    .eq("user_id", user_id)
                    .eq("document_id", document_id)
                    .order("page_number")
                    .execute()
                )
                if res.data is not None and len(res.data) > 0:
                    pages = [_from_supabase_page(row) for row in res.data]
                    _mem_pages[(user_id, document_id)] = pages
                    return pages
            except Exception as exc:
                log.warning("supabase.page_list_fallback", error=str(exc))

        return _mem_pages.get((user_id, document_id), [])

    async def delete_all(self, user_id: str, document_id: str) -> None:
        _mem_pages.pop((user_id, document_id), None)
        tbl = self._get_sb_table()
        if tbl is not None:
            try:
                await asyncio.to_thread(
                    lambda: tbl.delete().eq("user_id", user_id).eq("document_id", document_id).execute()
                )
            except Exception as exc:
                log.warning("supabase.page_delete_fallback", error=str(exc))


def _to_supabase_page(page: Page, user_id: str) -> dict[str, Any]:
    return {
        "id": f"{page.document_id}_{page.page_number:05d}",
        "document_id": page.document_id,
        "user_id": user_id,
        "page_number": page.page_number,
        "text": page.text,
        "confidence": page.confidence,
        "ocr_engine": page.ocr_engine,
        "processed_at": page.processed_at.isoformat() if isinstance(page.processed_at, datetime) else str(page.processed_at),
    }


def _from_supabase_page(data: dict[str, Any]) -> Page:
    proc_at = data["processed_at"]
    if isinstance(proc_at, str):
        proc_dt = datetime.fromisoformat(proc_at.replace("Z", "+00:00"))
    else:
        proc_dt = proc_at

    return Page(
        document_id=data["document_id"],
        page_number=int(data["page_number"]),
        text=data.get("text", ""),
        confidence=float(data.get("confidence", 1.0)),
        ocr_engine=data.get("ocr_engine", "paddleocr"),
        processed_at=proc_dt,
    )

