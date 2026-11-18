"""Task queue abstraction. Thin wrapper around arq so route/service code
doesn't import arq directly — easier to swap (or mock in tests)."""

from __future__ import annotations

import asyncio
from typing import Any, Protocol

from arq.connections import ArqRedis, RedisSettings, create_pool

from app.core.logging import get_logger

log = get_logger(__name__)


class TaskQueue(Protocol):
    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None: ...


class ArqTaskQueue:
    def __init__(self, pool: ArqRedis) -> None:
        self._pool = pool

    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None:
        job = await self._pool.enqueue_job(function_name, *args, **kwargs)
        return job.job_id if job else None

    async def aclose(self) -> None:
        await self._pool.aclose()


class NoopTaskQueue:
    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None:
        return "noop-job"

    async def aclose(self) -> None:
        pass


class BackgroundTaskQueue:
    """In-process background task queue when Redis/arq is not running.

    Executes OCR and ingestion sequentially in an asyncio background task.
    """

    _instance: BackgroundTaskQueue | None = None
    _tasks: set[asyncio.Task[Any]] = set()

    @classmethod
    def get_instance(cls) -> BackgroundTaskQueue:
        if cls._instance is None:
            cls._instance = BackgroundTaskQueue()
        return cls._instance

    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None:
        if function_name == "ocr_document" and len(args) >= 2:
            user_id, doc_id = str(args[0]), str(args[1])
            task = asyncio.create_task(self._process_document(user_id, doc_id))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)
            log.info(
                "bg_task.enqueued",
                function=function_name,
                user_id=user_id,
                document_id=doc_id,
            )
            return f"bg-{doc_id}"
        log.warning("bg_task.unhandled_function", function=function_name)
        return "noop-job"

    async def _process_document(self, user_id: str, doc_id: str) -> None:
        try:
            from qdrant_client import AsyncQdrantClient

            from app.core.config import get_settings
            from app.main import get_rag_service_singleton
            from app.models.document import DocumentStatus
            from app.repositories.document_repo import DocumentRepository
            from app.repositories.page_repo import PageRepository
            from app.repositories.qdrant_repo import QdrantRepository
            from app.services.chunking_service import ChunkingService
            from app.services.embedding_service import EmbeddingService
            from app.services.ingest_service import IngestService
            from app.services.ocr_service import OcrService
            from app.services.storage_service import StorageService
            from app.workers.paddle_engine import PaddleOcrEngine

            doc_repo = DocumentRepository()
            settings = get_settings()

            # Wait briefly for caller route (finalize_upload) to persist QUEUED state
            await asyncio.sleep(0.3)
            doc = await doc_repo.get(user_id, doc_id)
            if doc is None:
                log.warning("bg_task.doc_not_found", user_id=user_id, document_id=doc_id)
                return

            for _ in range(10):
                if doc.status == DocumentStatus.QUEUED:
                    break
                if doc.status in (
                    DocumentStatus.PROCESSING,
                    DocumentStatus.OCR_COMPLETE,
                    DocumentStatus.INDEXING,
                    DocumentStatus.INDEXED,
                ):
                    return
                await asyncio.sleep(0.3)
                doc = await doc_repo.get(user_id, doc_id)
                if doc is None:
                    return

            if doc.status == DocumentStatus.UPLOADED:
                await doc_repo.update_status(user_id, doc_id, DocumentStatus.QUEUED)

            # Step 1: Run OCR
            ocr = OcrService(
                doc_repo=doc_repo,
                page_repo=PageRepository(),
                storage=StorageService(
                    bucket_name=settings.supabase_storage_bucket,
                    storage_dir=settings.storage_dir,
                ),
                engine=PaddleOcrEngine(),
                max_pages=settings.ocr_max_pages,
                render_scale=settings.ocr_render_scale,
            )
            await ocr.process(user_id, doc_id)

            # Step 2: Run Ingestion into Qdrant
            rag = get_rag_service_singleton()
            if rag is not None:
                embedder = rag._embedder
                qdrant_repo = rag._qdrant_repo
            else:
                embedder = EmbeddingService(
                    model_name=settings.embedding_model,
                    batch_size=settings.embedding_batch_size,
                )
                try:
                    qdrant_client = AsyncQdrantClient(
                        url=settings.qdrant_url,
                        api_key=settings.qdrant_api_key,
                        timeout=2.0,
                        check_compatibility=False,
                    )
                    qdrant_repo = QdrantRepository(
                        qdrant_client,
                        collection=settings.qdrant_collection_name,
                        vector_dim=settings.embedding_dim,
                    )
                except Exception:
                    qdrant_client = AsyncQdrantClient(
                        location=":memory:", check_compatibility=False
                    )
                    qdrant_repo = QdrantRepository(
                        qdrant_client,
                        collection=settings.qdrant_collection_name,
                        vector_dim=settings.embedding_dim,
                    )

            try:
                await qdrant_repo.ensure_collection()
            except Exception as e:
                log.warning("bg_task.ensure_collection_failed", error=str(e))

            chunker = ChunkingService(
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap,
            )
            ingest = IngestService(
                doc_repo=doc_repo,
                page_repo=PageRepository(),
                qdrant_repo=qdrant_repo,
                chunker=chunker,
                embedder=embedder,
            )
            await ingest.process(user_id, doc_id)
            log.info("bg_task.pipeline_complete", user_id=user_id, document_id=doc_id)
        except Exception:
            log.exception("bg_task.pipeline_failed", user_id=user_id, document_id=doc_id)

    async def aclose(self) -> None:
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)


async def make_arq_pool(redis_url: str) -> ArqRedis:
    return await create_pool(RedisSettings.from_dsn(redis_url))
