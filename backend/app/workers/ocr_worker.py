"""arq worker entrypoint.

Run via:  arq app.workers.ocr_worker.WorkerSettings

We keep ``max_jobs = 1`` on purpose: PaddleOCR is CPU-bound and the GIL would
serialize concurrent jobs anyway. Scale by adding more worker containers
(horizontally), not more threads per worker. See ADR 0005.

Two tasks live here:
  * ocr_document — runs PaddleOCR over the source bytes; on success chains to
  * ingest_document — chunks + embeds + upserts to Qdrant.

The chain happens via ctx['redis'].enqueue_job so each task retries
independently and is observable as its own job in arq.
"""

from __future__ import annotations

from typing import Any

from arq.connections import RedisSettings
from qdrant_client import AsyncQdrantClient

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.core.otel import configure_tracing
from app.core.supabase import initialize_supabase
from app.repositories.document_repo import DocumentRepository
from app.repositories.page_repo import PageRepository
from app.repositories.qdrant_repo import QdrantRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.ingest_service import IngestService
from app.services.ocr_service import OcrService
from app.services.storage_service import StorageService

log = get_logger(__name__)


async def ocr_document(ctx: dict[str, Any], user_id: str, document_id: str) -> dict[str, object]:
    service: OcrService = ctx["ocr_service"]
    job_try = ctx.get("job_try", 1)
    log.info(
        "ocr.task.start",
        user_id=user_id,
        document_id=document_id,
        job_try=job_try,
    )
    result = await service.process(user_id, document_id)

    # Chain to ingest regardless of skip-or-not. Ingest is idempotent on its
    # side (delete-then-rewrite Qdrant points), so this can't corrupt anything.
    redis = ctx.get("redis")
    if redis is not None:
        await redis.enqueue_job("ingest_document", user_id, document_id)
        log.info(
            "ocr.task.ingest_enqueued",
            user_id=user_id,
            document_id=document_id,
        )
    return result


async def ingest_document(ctx: dict[str, Any], user_id: str, document_id: str) -> dict[str, object]:
    service: IngestService = ctx["ingest_service"]
    log.info("ingest.task.start", user_id=user_id, document_id=document_id)
    return await service.process(user_id, document_id)


async def _startup(ctx: dict[str, Any]) -> None:
    settings = get_settings()
    configure_logging(settings)
    configure_tracing(settings)

    initialize_supabase(settings)

    from app.workers.paddle_engine import PaddleOcrEngine

    engine = PaddleOcrEngine()

    ctx["ocr_service"] = OcrService(
        doc_repo=DocumentRepository(),
        page_repo=PageRepository(),
        storage=StorageService(bucket_name=settings.supabase_storage_bucket),
        engine=engine,
        max_pages=settings.ocr_max_pages,
        render_scale=settings.ocr_render_scale,
    )

    # Qdrant + embeddings + chunker live alongside OCR in the same worker.
    qdrant_client = AsyncQdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
    )
    qdrant_repo = QdrantRepository(
        qdrant_client,
        collection=settings.qdrant_collection_name,
        vector_dim=settings.embedding_dim,
    )
    await qdrant_repo.ensure_collection()

    embedder = EmbeddingService(
        model_name=settings.embedding_model,
        batch_size=settings.embedding_batch_size,
    )
    embedder.warm_up()

    chunker = ChunkingService(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    ctx["qdrant_client"] = qdrant_client
    ctx["ingest_service"] = IngestService(
        doc_repo=DocumentRepository(),
        page_repo=PageRepository(),
        qdrant_repo=qdrant_repo,
        chunker=chunker,
        embedder=embedder,
    )
    log.info(
        "worker.startup",
        engine=engine.name,
        embedding_model=settings.embedding_model,
        qdrant=settings.qdrant_url,
        collection=settings.qdrant_collection_name,
    )


async def _shutdown(ctx: dict[str, Any]) -> None:
    client = ctx.get("qdrant_client")
    if client is not None:
        await client.close()
    log.info("worker.shutdown")


_settings = get_settings()


class WorkerSettings:
    functions = [ocr_document, ingest_document]
    on_startup = _startup
    on_shutdown = _shutdown
    redis_settings = RedisSettings.from_dsn(_settings.redis_url)
    max_tries = _settings.ocr_max_retries
    job_timeout = _settings.ocr_job_timeout_seconds
    max_jobs = 1
    retry_jobs = True
