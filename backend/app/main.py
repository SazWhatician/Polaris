from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from qdrant_client import AsyncQdrantClient

from app.api import agent_llm, agents, chat, documents, graph, graph_embeddings, health, me, pages, pathfinder, planner_agent, resource_agent, syllabus, twin
from app.core.config import Settings, get_settings
from app.core.firebase import initialize_firebase
from app.core.logging import RequestIdMiddleware, configure_logging, get_logger
from app.core.otel import configure_tracing, instrument_app
from app.repositories.qdrant_repo import QdrantRepository
from app.services.embedding_service import EmbeddingService
from app.services.groq_client import GroqClient
from app.services.rag_service import RagService
from app.services.task_queue import ArqTaskQueue, make_arq_pool


def _build_app(settings: Settings) -> FastAPI:
    configure_logging(settings)
    configure_tracing(settings)
    log = get_logger(__name__)

    @asynccontextmanager
    async def lifespan(app_: FastAPI) -> AsyncIterator[None]:
        initialize_firebase(settings)

        # arq pool for enqueueing OCR jobs.
        try:
            pool = await make_arq_pool(settings.redis_url)
            app_.state.task_queue = ArqTaskQueue(pool)
            log.info("app.task_queue.connected", redis=settings.redis_url)
        except Exception as exc:  # noqa: BLE001
            app_.state.task_queue = None
            log.warning("app.task_queue.unavailable", error=str(exc))

        # RAG stack: Qdrant client + embedding singleton + Groq client.
        # We log warnings (not errors) when these aren't configured so /health
        # stays up; chat routes return 503 in that case.
        qdrant_client: AsyncQdrantClient | None = None
        try:
            qdrant_client = AsyncQdrantClient(
                url=settings.qdrant_url, api_key=settings.qdrant_api_key
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
 
            groq_keys = settings.parsed_groq_api_keys
            if not groq_keys:
                raise RuntimeError("No Groq API keys configured")
            groq = GroqClient(api_keys=groq_keys, model=settings.groq_model)

            gemini_keys = settings.parsed_gemini_api_keys
            if gemini_keys:
                from app.services.gemini_client import GeminiClient

                app_.state.gemini = GeminiClient(api_keys=gemini_keys, model=settings.gemini_model)
            else:
                app_.state.gemini = None

            app_.state.rag_service = RagService(
                embedder=embedder,
                qdrant_repo=qdrant_repo,
                groq=groq,
                default_top_k=settings.rag_top_k,
                max_context_chars=settings.rag_max_context_chars,
            )
            app_.state.qdrant_repo = qdrant_repo
            app_.state.qdrant_client = qdrant_client
            log.info(
                "app.rag.ready",
                qdrant=settings.qdrant_url,
                collection=settings.qdrant_collection_name,
                model=settings.groq_model,
            )
        except Exception as exc:  # noqa: BLE001
            app_.state.rag_service = None
            app_.state.qdrant_repo = None
            app_.state.qdrant_client = qdrant_client
            log.warning("app.rag.unavailable", error=str(exc))

        log.info("app.startup", env=settings.app_env, name=settings.app_name)
        try:
            yield
        finally:
            queue = getattr(app_.state, "task_queue", None)
            if queue is not None:
                await queue.aclose()
            client = getattr(app_.state, "qdrant_client", None)
            if client is not None:
                await client.close()
            log.info("app.shutdown")

    app = FastAPI(
        title="Polaris API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id"],
    )

    app.include_router(health.router)
    app.include_router(me.router)
    app.include_router(documents.router)
    app.include_router(pages.router)
    app.include_router(chat.router)
    app.include_router(syllabus.router)
    app.include_router(agents.router)
    app.include_router(resource_agent.router)
    app.include_router(planner_agent.router)
    app.include_router(graph.router)
    app.include_router(twin.router)
    app.include_router(pathfinder.router)
    app.include_router(agent_llm.router)
    app.include_router(graph_embeddings.router)

    instrument_app(app)
    return app


app = _build_app(get_settings())
