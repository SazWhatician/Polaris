import pytest
from app.models.rag import RetrievedChunk
from app.services.rerank_service import RerankService


def test_rerank_service_with_flashrank():
    reranker = RerankService()
    chunks = [
        RetrievedChunk(
            document_id="doc-1",
            document_filename="calculus.pdf",
            page_number=1,
            chunk_index=0,
            text="The derivative of sin(x) is cos(x).",
            score=0.75,
        ),
        RetrievedChunk(
            document_id="doc-2",
            document_filename="history.pdf",
            page_number=5,
            chunk_index=1,
            text="The French Revolution began in 1789.",
            score=0.85,
        ),
        RetrievedChunk(
            document_id="doc-1",
            document_filename="calculus.pdf",
            page_number=2,
            chunk_index=2,
            text="Integration is the reverse process of differentiation.",
            score=0.70,
        ),
    ]

    # Query about mathematics
    results = reranker.rerank(
        query="What is the derivative of trigonometric functions?",
        chunks=chunks,
        top_k=2,
    )

    assert len(results) == 2
    # The math chunk should be ranked above the history chunk
    assert "derivative" in results[0].text or "Integration" in results[0].text


def test_rerank_service_fallback_empty():
    reranker = RerankService()
    assert reranker.rerank(query="test", chunks=[], top_k=5) == []
