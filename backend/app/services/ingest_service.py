"""Chunk OCR text → embed → upsert to Qdrant.

Idempotent: every run deletes existing chunks for the document and writes
fresh ones. So re-ingest after a failure or after re-OCR is safe.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from opentelemetry import trace

from app.core.logging import get_logger
from app.models.document import DocumentStatus
from app.services.status_transition import assert_transition

if TYPE_CHECKING:
    from app.repositories.document_repo import DocumentRepository
    from app.repositories.page_repo import PageRepository
    from app.repositories.qdrant_repo import QdrantRepository
    from app.services.chunking_service import ChunkingService
    from app.services.embedding_service import EmbeddingService

log = get_logger(__name__)
tracer = trace.get_tracer(__name__)


class DocumentNotFoundError(Exception):
    pass


class IngestService:
    def __init__(
        self,
        *,
        doc_repo: DocumentRepository,
        page_repo: PageRepository,
        qdrant_repo: QdrantRepository,
        chunker: ChunkingService,
        embedder: EmbeddingService,
    ) -> None:
        self._doc_repo = doc_repo
        self._page_repo = page_repo
        self._qdrant_repo = qdrant_repo
        self._chunker = chunker
        self._embedder = embedder

    async def process(self, user_id: str, document_id: str) -> dict[str, object]:
        with tracer.start_as_current_span("ingest.process") as span:
            span.set_attribute("doc.id", document_id)
            span.set_attribute("user.id", user_id)

            doc = await self._doc_repo.get(user_id, document_id)
            if doc is None:
                raise DocumentNotFoundError(document_id)

            assert_transition(doc.status, DocumentStatus.INDEXING)
            await self._doc_repo.update_status(
                user_id,
                document_id,
                DocumentStatus.INDEXING,
                error=None,
            )

            try:
                pages = await self._page_repo.list_pages(user_id, document_id)
                chunks = self._chunker.chunk_pages(pages)
                span.set_attribute("ingest.chunk_count", len(chunks))

                # Delete-then-rewrite makes re-ingest idempotent.
                await self._qdrant_repo.delete_for_document(
                    user_id=user_id,
                    document_id=document_id,
                )

                if chunks:
                    vectors = await self._embedder.embed([c.text for c in chunks])
                    await self._qdrant_repo.upsert_chunks(
                        user_id=user_id,
                        document_id=document_id,
                        document_filename=doc.filename,
                        chunks=chunks,
                        vectors=vectors,
                    )

                await self._doc_repo.update_status(
                    user_id,
                    document_id,
                    DocumentStatus.INDEXED,
                )
                log.info(
                    "ingest.complete",
                    user_id=user_id,
                    document_id=document_id,
                    chunk_count=len(chunks),
                )
                return {"chunk_count": len(chunks)}

            except Exception as exc:
                await self._doc_repo.update_status(
                    user_id,
                    document_id,
                    DocumentStatus.FAILED,
                    error=str(exc)[:500],
                )
                log.exception(
                    "ingest.failed",
                    user_id=user_id,
                    document_id=document_id,
                    error=str(exc),
                )
                span.set_attribute("ingest.failed", True)
                raise
