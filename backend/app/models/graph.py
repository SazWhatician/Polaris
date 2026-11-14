from datetime import datetime

from pydantic import BaseModel, Field


class ConceptNode(BaseModel):
    """Represents a single academic concept node in the knowledge graph."""

    id: str
    name: str
    category: str = "concept"  # e.g., concept, formula, algorithm, theorem, architecture
    description: str = ""
    source_document_ids: list[str] = Field(default_factory=list)
    source_pages: list[int] = Field(default_factory=list)
    importance_score: float = 0.5  # 0.0 to 1.0 scale


class ConceptRelationship(BaseModel):
    """Represents a directional relationship between two concepts."""

    id: str
    source_concept_id: str
    target_concept_id: str
    relation_type: str = "prerequisite_of"  # e.g., prerequisite_of, part_of, extends, related_to
    description: str = ""
    confidence_score: float = 0.8


class ConceptCluster(BaseModel):
    """Represents a community cluster of related concepts."""

    cluster_id: str
    name: str
    node_ids: list[str] = Field(default_factory=list)
    color_hex: str = "#6366f1"


class KnowledgeGraph(BaseModel):
    """Full user knowledge graph model."""

    id: str
    user_id: str
    nodes: list[ConceptNode] = Field(default_factory=list)
    edges: list[ConceptRelationship] = Field(default_factory=list)
    clusters: list[ConceptCluster] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class GraphExtractionRequest(BaseModel):
    """Payload for triggering concept extraction."""

    document_ids: list[str] | None = None
    syllabus_id: str | None = None


class GraphExtractionResponse(BaseModel):
    """Response returned after running concept graph extraction."""

    success: bool
    graph_id: str
    node_count: int
    edge_count: int
    cluster_count: int
    message: str
