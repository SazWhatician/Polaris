"""Singleton sentence-transformers embedder, wrapped async.

The model is loaded once per process and reused. Both the API container
(for query embedding) and the worker container (for ingest) use this.
The model is baked into both images so first call is fast (no HF download).
"""

from __future__ import annotations

import asyncio
from typing import Any

from app.core.logging import get_logger

log = get_logger(__name__)

_model: Any = None


def _get_model(model_name: str) -> Any:
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        log.info("embedding.model.loading", model=model_name)
        _model = SentenceTransformer(model_name)
        log.info("embedding.model.ready", model=model_name)
    return _model


class EmbeddingService:
    def __init__(self, *, model_name: str, batch_size: int) -> None:
        self._model_name = model_name
        self._batch_size = batch_size

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        return await asyncio.to_thread(self._embed_sync, texts)

    async def embed_one(self, text: str) -> list[float]:
        return (await self.embed([text]))[0]

    def warm_up(self) -> None:
        """Load the model synchronously. Call once at process startup so the
        first request doesn't pay the cold-start cost."""
        _get_model(self._model_name)

    def _embed_sync(self, texts: list[str]) -> list[list[float]]:
        model = _get_model(self._model_name)
        vectors = model.encode(
            texts,
            batch_size=self._batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,  # cosine over normalized = dot product
            convert_to_numpy=True,
        )
        return [v.tolist() for v in vectors]
