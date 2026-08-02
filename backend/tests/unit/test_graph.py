import pytest
from app.models.graph import KnowledgeGraph, ConceptNode, ConceptRelationship
from app.services.concept_extraction_service import ConceptExtractionService
from app.repositories.graph_repo import GraphRepository


def test_concept_extraction_service_demo_graph():
    service = ConceptExtractionService()
    graph = service.generate_demo_graph("user_test_123")

    assert isinstance(graph, KnowledgeGraph)
    assert graph.user_id == "user_test_123"
    assert len(graph.nodes) >= 5
    assert len(graph.edges) >= 4
    assert len(graph.clusters) >= 1


def test_concept_extraction_service_fallback_parsing():
    service = ConceptExtractionService()
    texts = [{"doc_id": "d1", "page": 1, "text": "Linear Algebra is fundamental for Neural Networks and Transformers."}]

    graph = service.extract_from_texts(user_id="user_test_123", texts=texts)

    assert isinstance(graph, KnowledgeGraph)
    assert len(graph.nodes) > 0
    assert len(graph.clusters) >= 1


def test_graph_repository_cache_and_node_detail():
    repo = GraphRepository()
    service = ConceptExtractionService()

    graph = service.generate_demo_graph("user_repo_test")
    repo.save_graph("user_repo_test", graph)

    retrieved = repo.get_latest_graph("user_repo_test")
    assert retrieved is not None
    assert len(retrieved.nodes) == len(graph.nodes)

    node_detail = repo.get_node_detail("user_repo_test", "linear_algebra")
    assert node_detail is not None
    assert node_detail["node"]["id"] == "linear_algebra"
    assert "prerequisites" in node_detail
    assert "dependents" in node_detail
