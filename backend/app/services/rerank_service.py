"""Ultra-fast cross-encoder reranker using FlashRank (ONNX-powered).

Architecture:
  Two-stage retrieval pipeline:
    1. First stage: Qdrant dense vector search (high recall, top 20+ candidates).
    2. Second stage: FlashRank cross-encoder reranking (high precision, top K).

FlashRank runs a lightweight BERT/MiniLM cross-encoder via ONNX runtime with zero
PyTorch GPU overhead, executing in ~10-20ms on CPU and substantially boosting MRR@K
and Precision@K for academic STEM queries.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from opentelemetry import trace

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.models.rag import RetrievedChunk

log = get_logger(__name__)
tracer = trace.get_tracer(__name__)


class RerankService:
    def __init__(self, *, model_name: str = "ms-marco-TinyBERT-L-2-v2") -> None:
        self._model_name = model_name
        self._ranker = None
        self._init_ranker()

    def _init_ranker(self) -> None:
        try:
            from flashrank import Ranker
            self._ranker = Ranker(model_name=self._model_name)
            log.info("rerank.initialized", model=self._model_name)
        except Exception as exc:
            log.warning("rerank.init_failed_fallback_enabled", error=str(exc))
            self._ranker = None

    def rerank(
        self,
        *,
        query: str,
        chunks: list[RetrievedChunk],
        top_k: int,
    ) -> list[RetrievedChunk]:
        if not chunks:
            return []

        # If pool is already <= top_k or ranker unavailable, return first top_k as-is
        if len(chunks) <= top_k or self._ranker is None:
            return chunks[:top_k]

        with tracer.start_as_current_span("rag.rerank") as span:
            span.set_attribute("rerank.input_count", len(chunks))
            span.set_attribute("rerank.target_top_k", top_k)
            span.set_attribute("rerank.model", self._model_name)

            try:
                from flashrank import RerankRequest

                passages = [
                    {"id": idx, "text": c.text, "meta": idx}
                    for idx, c in enumerate(chunks)
                ]
                request = RerankRequest(query=query, passages=passages)
                results = self._ranker.rerank(request)

                reranked_chunks: list[RetrievedChunk] = []
                for item in results[:top_k]:
                    idx = int(item["id"])
                    chunk = chunks[idx]
                    # Update score with cross-encoder score if available
                    new_score = float(item.get("score", chunk.score))
                    reranked_chunk = chunk.model_copy(update={"score": new_score})
                    reranked_chunks.append(reranked_chunk)

                span.set_attribute("rerank.output_count", len(reranked_chunks))
                log.debug(
                    "rerank.complete",
                    input_count=len(chunks),
                    output_count=len(reranked_chunks),
                )
                return reranked_chunks

            except Exception as exc:
                log.warning("rerank.execution_failed_using_dense_order", error=str(exc))
                return chunks[:top_k]
