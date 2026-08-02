from typing import Optional, Dict, Any
from google.cloud.firestore import Client
from app.core.firebase import get_firestore
from app.models.graph import KnowledgeGraph, ConceptNode, ConceptRelationship

# In-memory LRU-style cache for active user knowledge graphs
_graph_cache: Dict[str, KnowledgeGraph] = {}


class GraphRepository:
    """Repository for persisting and querying user Knowledge Graphs in Firestore."""

    def __init__(self, db: Optional[Client] = None):
        self._db = db

    @property
    def db(self) -> Client:
        if self._db is None:
            self._db = get_firestore()
        return self._db

    def save_graph(self, user_id: str, graph: KnowledgeGraph) -> None:
        """Save user knowledge graph to Firestore and update in-memory cache."""
        _graph_cache[user_id] = graph

        try:
            doc_ref = self.db.collection("users").document(user_id).collection("knowledge_graph").document("latest")
            doc_ref.set(graph.model_dump())
        except Exception:
            # Best-effort persistence; in-memory cache serves as fallback
            pass

    def get_latest_graph(self, user_id: str) -> Optional[KnowledgeGraph]:
        """Fetch the latest KnowledgeGraph for a user."""
        if user_id in _graph_cache:
            return _graph_cache[user_id]

        try:
            doc_ref = self.db.collection("users").document(user_id).collection("knowledge_graph").document("latest")
            snapshot = doc_ref.get()
            if snapshot.exists:
                data = snapshot.to_dict()
                graph = KnowledgeGraph.model_validate(data)
                _graph_cache[user_id] = graph
                return graph
        except Exception:
            pass

        return None

    def get_node_detail(self, user_id: str, node_id: str) -> Optional[Dict[str, Any]]:
        """Get detail for a specific node including direct connected prerequisites and dependents."""
        graph = self.get_latest_graph(user_id)
        if not graph:
            return None

        target_node: Optional[ConceptNode] = None
        for n in graph.nodes:
            if n.id == node_id:
                target_node = n
                break

        if not target_node:
            return None

        # Find connected relationships
        prerequisites: list[ConceptNode] = []
        dependents: list[ConceptNode] = []
        nodes_dict = {n.id: n for n in graph.nodes}

        for edge in graph.edges:
            if edge.target_concept_id == node_id and edge.source_concept_id in nodes_dict:
                prerequisites.append(nodes_dict[edge.source_concept_id])
            elif edge.source_concept_id == node_id and edge.target_concept_id in nodes_dict:
                dependents.append(nodes_dict[edge.target_concept_id])

        return {
            "node": target_node.model_dump(),
            "prerequisites": [p.model_dump() for p in prerequisites],
            "dependents": [d.model_dump() for d in dependents],
        }
