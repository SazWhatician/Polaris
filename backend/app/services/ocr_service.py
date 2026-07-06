"""OCR orchestration: download → hash → idempotency check → render pages → OCR → persist.

The OCR engine is abstracted behind ``OcrEngine`` so tests inject a fake.
The real engine (``PaddleOcrEngine``) is constructed inside the worker process
once and reused across tasks via the worker context.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Protocol

from opentelemetry import trace

from app.core.logging import get_logger
from app.models.document import DocumentStatus, Page
from app.services.hashing import sha256_hex
from app.services.page_extractor import extract_pages
from app.services.status_transition import assert_transition

if TYPE_CHECKING:
    from PIL.Image import Image as PILImage

    from app.repositories.document_repo import DocumentRepository
    from app.repositories.page_repo import PageRepository
    from app.services.storage_service import StorageService

log = get_logger(__name__)
tracer = trace.get_tracer(__name__)


@dataclass(frozen=True)
class PageOcrResult:
    text: str
    confidence: float


class OcrEngine(Protocol):
    name: str

    def ocr_image(self, image: PILImage) -> PageOcrResult: ...


class DocumentNotFoundError(Exception):
    pass


class OcrService:
    def __init__(
        self,
        *,
        doc_repo: DocumentRepository,
        page_repo: PageRepository,
        storage: StorageService,
        engine: OcrEngine,
        max_pages: int,
        render_scale: float,
    ) -> None:
        self._doc_repo = doc_repo
        self._page_repo = page_repo
        self._storage = storage
        self._engine = engine
        self._max_pages = max_pages
        self._render_scale = render_scale

    async def process(self, user_id: str, document_id: str) -> dict[str, object]:
        with tracer.start_as_current_span("ocr.process") as span:
            span.set_attribute("doc.id", document_id)
            span.set_attribute("user.id", user_id)

            doc = await self._doc_repo.get(user_id, document_id)
            if doc is None:
                raise DocumentNotFoundError(document_id)

            blob_bytes = await self._storage.download_bytes(doc.storage_path)
            new_hash = sha256_hex(blob_bytes)
            span.set_attribute("doc.size_bytes", len(blob_bytes))
            span.set_attribute("doc.content_hash", new_hash)

            if doc.status == DocumentStatus.OCR_COMPLETE and doc.content_hash == new_hash:
                log.info(
                    "ocr.skipped_unchanged",
                    user_id=user_id,
                    document_id=document_id,
                    hash=new_hash,
                )
                span.set_attribute("ocr.skipped", True)
                return {"skipped": True, "reason": "unchanged", "content_hash": new_hash}

            assert_transition(doc.status, DocumentStatus.PROCESSING)
            await self._doc_repo.update_status(
                user_id,
                document_id,
                DocumentStatus.PROCESSING,
                content_hash=new_hash,
                error=None,
            )

            try:
                images = extract_pages(blob_bytes, doc.mime_type, render_scale=self._render_scale)
                if len(images) > self._max_pages:
                    raise ValueError(
                        f"Document has {len(images)} pages, exceeds limit {self._max_pages}"
                    )

                pages = self._ocr_each(document_id, images)
                await self._page_repo.write_pages(user_id, document_id, pages)

                await self._doc_repo.update_status(
                    user_id,
                    document_id,
                    DocumentStatus.OCR_COMPLETE,
                    page_count=len(pages),
                    ocr_completed_at=datetime.now(UTC),
                )
                log.info(
                    "ocr.complete",
                    user_id=user_id,
                    document_id=document_id,
                    page_count=len(pages),
                )
                span.set_attribute("ocr.page_count", len(pages))
                return {"page_count": len(pages), "content_hash": new_hash}

            except Exception as exc:
                await self._doc_repo.update_status(
                    user_id,
                    document_id,
                    DocumentStatus.FAILED,
                    error=str(exc)[:500],
                )
                log.exception(
                    "ocr.failed",
                    user_id=user_id,
                    document_id=document_id,
                    error=str(exc),
                )
                span.set_attribute("ocr.failed", True)
                raise

    def _ocr_each(self, document_id: str, images: list[PILImage]) -> list[Page]:
        pages: list[Page] = []
        now = datetime.now(UTC)
        for i, img in enumerate(images, start=1):
            with tracer.start_as_current_span("ocr.page") as span:
                span.set_attribute("page.number", i)
                result = self._engine.ocr_image(img)
                pages.append(
                    Page(
                        document_id=document_id,
                        page_number=i,
                        text=result.text,
                        confidence=result.confidence,
                        ocr_engine=self._engine.name,
                        processed_at=now,
                    )
                )
                span.set_attribute("ocr.confidence", result.confidence)
        return pages
