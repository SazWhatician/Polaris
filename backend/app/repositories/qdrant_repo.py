"""Qdrant access for Polaris chunks.

Everything in here enforces multi-tenant safety by always sending a
`must` filter on `user_id`. The API never calls Qdrant directly — it goes
through this repo.
"""

from __future__ import annotations

import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qm

from app.core.logging import get_logger
from app.models.rag import Chunk, RetrievedChunk

log = get_logger(__name__)


class QdrantRepository:
    def __init__(
        self,
        client: AsyncQdrantClient,
        *,
        collection: str,
        vector_dim: int,
    ) -> None:
        self._client = client
        self._collection = collection
        self._vector_dim = vector_dim

    async def ensure_collection(self) -> None:
        """Create the collection on first run, idempotent."""
        existing = await self._client.get_collections()
        names = {c.name for c in existing.collections}
        if self._collection in names:
            return

        await self._client.create_collection(
            collection_name=self._collection,
            vectors_config=qm.VectorParams(size=self._vector_dim, distance=qm.Distance.COSINE),
        )
        # Payload indexes accelerate the per-query user_id + document_id filters.
        await self._client.create_payload_index(
            collection_name=self._collection,
            field_name="user_id",
            field_schema=qm.PayloadSchemaType.KEYWORD,
        )
        await self._client.create_payload_index(
            collection_name=self._collection,
            field_name="document_id",
            field_schema=qm.PayloadSchemaType.KEYWORD,
        )
        log.info("qdrant.collection.created", collection=self._collection)

    async def upsert_chunks(
        self,
        *,
        user_id: str,
        document_id: str,
        document_filename: str,
        chunks: list[Chunk],
        vectors: list[list[float]],
    ) -> None:
        if len(chunks) != len(vectors):
            raise ValueError("chunks and vectors must align")
        if not chunks:
            return

        points = [
            qm.PointStruct(
                # Deterministic per (doc, page, chunk) so re-runs replace cleanly.
                id=str(
                    uuid.uuid5(
                        uuid.NAMESPACE_URL,
                        f"polaris/{user_id}/{document_id}/{c.page_number}/{c.chunk_index}",
                    )
                ),
                vector=v,
                payload={
                    "user_id": user_id,
                    "document_id": document_id,
                    "document_filename": document_filename,
                    "page_number": c.page_number,
                    "chunk_index": c.chunk_index,
                    "text": c.text,
                },
            )
            for c, v in zip(chunks, vectors, strict=True)
        ]
        await self._client.upsert(collection_name=self._collection, points=points)

    async def delete_for_document(self, *, user_id: str, document_id: str) -> None:
        await self._client.delete(
            collection_name=self._collection,
            points_selector=qm.FilterSelector(
                filter=qm.Filter(
                    must=[
                        qm.FieldCondition(key="user_id", match=qm.MatchValue(value=user_id)),
                        qm.FieldCondition(
                            key="document_id", match=qm.MatchValue(value=document_id)
                        ),
                    ]
                )
            ),
        )

    async def search(
        self,
        *,
        user_id: str,
        query_vector: list[float],
        top_k: int,
        document_ids: list[str] | None = None,
    ) -> list[RetrievedChunk]:
        """Vector search scoped to a single user — non-negotiable."""
        must: list[qm.FieldCondition] = [
            qm.FieldCondition(key="user_id", match=qm.MatchValue(value=user_id))
        ]
        if document_ids:
            must.append(qm.FieldCondition(key="document_id", match=qm.MatchAny(any=document_ids)))

        result = await self._client.search(
            collection_name=self._collection,
            query_vector=query_vector,
            limit=top_k,
            query_filter=qm.Filter(must=must),
            with_payload=True,
        )
        return [
            RetrievedChunk(
                document_id=hit.payload["document_id"],
                document_filename=hit.payload.get("document_filename", ""),
                page_number=int(hit.payload["page_number"]),
                chunk_index=int(hit.payload["chunk_index"]),
                text=hit.payload["text"],
                score=float(hit.score),
            )
            for hit in result
            if hit.payload is not None
        ]
