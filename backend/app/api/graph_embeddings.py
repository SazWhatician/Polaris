from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user_id
from app.repositories.graph_repo import GraphRepository
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph Embeddings"])

_graph_repo = GraphRepository()


class TopicEmbeddingItem(BaseModel):
    topic_id: str
    name: str
    category: str
    embedding: list[float] = Field(default_factory=list)


class TopicEmbeddingsResponse(BaseModel):
    user_id: str
    topics: list[TopicEmbeddingItem] = Field(default_factory=list)


@router.get("/topic-embeddings", response_model=TopicEmbeddingsResponse)
async def get_topic_embeddings(
    user_id: str = Depends(get_current_user_id),
):
    """Returns user topic embeddings snapshot for Chrome Extension cross-tab study sensor caching."""
    graph = _graph_repo.get_latest_graph(user_id)
    if not graph or not graph.nodes:
        return TopicEmbeddingsResponse(user_id=user_id, topics=[])

    try:
        embedder = EmbeddingService()
        texts = [f"{n.name}: {n.description}" for n in graph.nodes]
        embeddings = embedder.embed_passages(texts)

        items = [
            TopicEmbeddingItem(
                topic_id=node.id,
                name=node.name,
                category=node.category,
                embedding=embeddings[idx].tolist(),
            )
            for idx, node in enumerate(graph.nodes)
        ]

        return TopicEmbeddingsResponse(user_id=user_id, topics=items)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate topic embeddings snapshot: {e}",
        )
