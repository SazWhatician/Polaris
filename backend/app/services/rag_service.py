"""Retrieval-Augmented Generation service.

Stages:
  1. Embed the question.
  2. Vector search Qdrant — always scoped by user_id.
  3. Build a [#N]-numbered context string.
  4. Load + format the versioned prompt.
  5. Stream tokens from Groq.

Yields a heterogeneous event stream (citations once, tokens streaming, then
done) so the SSE endpoint can map directly to client-renderable events.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import TYPE_CHECKING

from opentelemetry import trace

from app.core.logging import get_logger
from app.services import prompts

if TYPE_CHECKING:
    from app.models.rag import RetrievedChunk
    from app.repositories.qdrant_repo import QdrantRepository
    from app.services.embedding_service import EmbeddingService
    from app.services.groq_client import GroqClient
    from app.services.rerank_service import RerankService

log = get_logger(__name__)
tracer = trace.get_tracer(__name__)


class RagService:
    def __init__(
        self,
        *,
        embedder: EmbeddingService,
        qdrant_repo: QdrantRepository,
        groq: GroqClient,
        default_top_k: int,
        max_context_chars: int,
        reranker: RerankService | None = None,
    ) -> None:
        self._embedder = embedder
        self._qdrant_repo = qdrant_repo
        self._groq = groq
        self._default_top_k = default_top_k
        self._max_context_chars = max_context_chars
        self._reranker = reranker

    async def stream_answer(
        self,
        *,
        user_id: str,
        question: str,
        document_ids: list[str] | None = None,
        top_k: int | None = None,
    ) -> AsyncIterator[dict[str, object]]:
        effective_top_k = top_k or self._default_top_k

        with tracer.start_as_current_span("rag.embed_question"):
            qvec = await self._embedder.embed_one(question)

        with tracer.start_as_current_span("rag.search") as span:
            # First stage: candidate retrieval with broader top_k for cross-encoder reranker
            candidate_k = max(20, effective_top_k * 3) if self._reranker else effective_top_k
            span.set_attribute("rag.candidate_k", candidate_k)
            span.set_attribute("rag.target_top_k", effective_top_k)
            if document_ids:
                span.set_attribute("rag.document_scope", len(document_ids))

            candidates = await self._qdrant_repo.search(
                user_id=user_id,
                query_vector=qvec,
                top_k=candidate_k,
                document_ids=document_ids,
            )
            span.set_attribute("rag.candidates_retrieved", len(candidates))

            # Second stage: FlashRank cross-encoder reranking
            if self._reranker and candidates:
                chunks = self._reranker.rerank(
                    query=question,
                    chunks=candidates,
                    top_k=effective_top_k,
                )
            else:
                chunks = candidates[:effective_top_k]

            span.set_attribute("rag.final_chunks", len(chunks))

        # Send citations first so the UI can render chips before tokens arrive.
        yield {
            "type": "citations",
            "citations": [c.model_dump() for c in chunks],
        }

        if not chunks:
            yield {
                "type": "token",
                "content": (
                    "I couldn't find anything in your indexed notes that "
                    "answers this question. Try uploading more material or "
                    "rephrasing the question."
                ),
            }
            yield {"type": "done"}
            return

        context = self._format_context(chunks)
        template = prompts.load("rag_answer", "v1")
        prompt = template.format(context=context, question=question)

        with tracer.start_as_current_span("rag.generate") as span:
            span.set_attribute("rag.context_chars", len(context))
            async for token in self._groq.stream_completion(prompt):
                yield {"type": "token", "content": token}

        yield {"type": "done"}

    def _format_context(self, chunks: list[RetrievedChunk]) -> str:
        parts: list[str] = []
        total = 0
        for i, c in enumerate(chunks, start=1):
            entry = f"[#{i}] (source: {c.document_filename}, page {c.page_number})\n{c.text}"
            if total + len(entry) > self._max_context_chars:
                break
            parts.append(entry)
            total += len(entry)
        return "\n\n".join(parts)
