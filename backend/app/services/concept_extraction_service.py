import uuid
import re
from typing import List, Dict, Tuple, Set
from app.models.graph import ConceptNode, ConceptRelationship, ConceptCluster, KnowledgeGraph


# Curated palette for graph cluster visualization
CLUSTER_COLORS = [
    "#6366f1",  # Indigo
    "#38bdf8",  # Sky Blue
    "#34d399",  # Mint Emerald
    "#facc15",  # Cyber Gold
    "#fb7185",  # Rose Crimson
    "#a855f7",  # Vivid Purple
    "#f97316",  # Amber Orange
]


def slugify(text: str) -> str:
    """Normalize text into clean concept slug ID."""
    return re.sub(r"[^a-z0-9]", "_", text.lower().strip()).strip("_")


class ConceptExtractionService:
    """Service to extract, deduplicate, and cluster concepts into a Knowledge Graph."""

    def extract_from_texts(
        self,
        user_id: str,
        texts: List[Dict[str, str]],  # List of {"doc_id": ..., "page": ..., "text": ...}
        syllabus_topics: List[str] = None,
    ) -> KnowledgeGraph:
        """Extract concept triples and nodes from input text passages and syllabus topics."""

        raw_nodes: Dict[str, ConceptNode] = {}
        raw_edges: List[ConceptRelationship] = []

        # 1. Process syllabus topics first as core foundational nodes
        if syllabus_topics:
            for idx, topic_name in enumerate(syllabus_topics):
                node_id = slugify(topic_name)
                if not node_id:
                    continue
                raw_nodes[node_id] = ConceptNode(
                    id=node_id,
                    name=topic_name,
                    category="syllabus_topic",
                    description=f"Syllabus core topic: {topic_name}",
                    importance_score=0.9,
                )

        # 2. Extract concept nodes & relationships from text passages
        combined_text = "\n\n".join([item.get("text", "") for item in texts[:10]])
        if combined_text.strip():
            self._fallback_parse_text(combined_text, raw_nodes, raw_edges)

        # If no nodes extracted yet, populate seed demonstration knowledge graph
        if not raw_nodes:
            return self.generate_demo_graph(user_id)

        # 3. Community Clustering (Group connected component clusters)
        clusters = self._compute_clusters(raw_nodes, raw_edges)

        graph_id = f"graph_{uuid.uuid4().hex[:12]}"
        return KnowledgeGraph(
            id=graph_id,
            user_id=user_id,
            nodes=list(raw_nodes.values()),
            edges=raw_edges,
            clusters=clusters,
        )

    def _parse_llm_extraction(
        self,
        llm_response: str,
        nodes: Dict[str, ConceptNode],
        edges: List[ConceptRelationship],
        texts: List[Dict[str, str]],
    ):
        """Parse structured CONCEPT and RELATION lines from LLM response."""
        doc_ids = list(set(item.get("doc_id", "doc1") for item in texts if item.get("doc_id")))
        pages = list(set(int(item.get("page", 1)) for item in texts if item.get("page")))

        for line in llm_response.splitlines():
            line = line.strip()
            if line.startswith("CONCEPT:"):
                parts = line.replace("CONCEPT:", "").split("|")
                if len(parts) >= 1:
                    name = parts[0].strip()
                    cat = parts[1].strip() if len(parts) > 1 else "concept"
                    desc = parts[2].strip() if len(parts) > 2 else f"Key concept: {name}"
                    node_id = slugify(name)
                    if node_id and node_id not in nodes:
                        nodes[node_id] = ConceptNode(
                            id=node_id,
                            name=name,
                            category=cat.lower(),
                            description=desc,
                            source_document_ids=doc_ids,
                            source_pages=pages[:5],
                            importance_score=0.7,
                        )
            elif line.startswith("RELATION:"):
                rel_str = line.replace("RELATION:", "").strip()
                match = re.search(r"(.+?)\s*->\s*(.+?)\s*->\s*(.+)", rel_str)
                if match:
                    src_name, rel_type, tgt_name = match.group(1).strip(), match.group(2).strip(), match.group(3).strip()
                    src_id = slugify(src_name)
                    tgt_id = slugify(tgt_name)

                    if src_id in nodes and tgt_id in nodes and src_id != tgt_id:
                        edge_id = f"edge_{src_id}_to_{tgt_id}"
                        edges.append(
                            ConceptRelationship(
                                id=edge_id,
                                source_concept_id=src_id,
                                target_concept_id=tgt_id,
                                relation_type=slugify(rel_type),
                                description=f"{src_name} {rel_type} {tgt_name}",
                                confidence_score=0.85,
                            )
                        )

    def _fallback_parse_text(
        self,
        text: str,
        nodes: Dict[str, ConceptNode],
        edges: List[ConceptRelationship],
    ):
        """Rule-based fallback parser for capitalized academic key phrases."""
        words = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", text)
        top_concepts = list(set(words))[:8]
        for name in top_concepts:
            node_id = slugify(name)
            if node_id and node_id not in nodes:
                nodes[node_id] = ConceptNode(
                    id=node_id,
                    name=name,
                    category="concept",
                    description=f"Extracted concept: {name}",
                )

        # Create sequential prerequisite linkages between consecutive concepts
        node_list = list(nodes.keys())
        for i in range(len(node_list) - 1):
            src_id, tgt_id = node_list[i], node_list[i + 1]
            edges.append(
                ConceptRelationship(
                    id=f"edge_{src_id}_{tgt_id}",
                    source_concept_id=src_id,
                    target_concept_id=tgt_id,
                    relation_type="prerequisite_of",
                    description=f"{nodes[src_id].name} is a prerequisite for {nodes[tgt_id].name}",
                )
            )

    def _compute_clusters(
        self,
        nodes: Dict[str, ConceptNode],
        edges: List[ConceptRelationship],
    ) -> List[ConceptCluster]:
        """Compute community clusters across graph nodes."""
        adjacency: Dict[str, Set[str]] = {nid: set() for nid in nodes.keys()}
        for edge in edges:
            if edge.source_concept_id in adjacency and edge.target_concept_id in adjacency:
                adjacency[edge.source_concept_id].add(edge.target_concept_id)
                adjacency[edge.target_concept_id].add(edge.source_concept_id)

        visited: Set[str] = set()
        clusters: List[ConceptCluster] = []

        for idx, (node_id, node) in enumerate(nodes.items()):
            if node_id in visited:
                continue

            # Breadth-first search for connected component
            component: List[str] = []
            queue = [node_id]
            visited.add(node_id)

            while queue:
                curr = queue.pop(0)
                component.append(curr)
                for neighbor in adjacency.get(curr, set()):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append(neighbor)

            cluster_color = CLUSTER_COLORS[len(clusters) % len(CLUSTER_COLORS)]
            clusters.append(
                ConceptCluster(
                    cluster_id=f"cluster_{len(clusters) + 1}",
                    name=f"Cluster {len(clusters) + 1}: {node.name}",
                    node_ids=component,
                    color_hex=cluster_color,
                )
            )

        return clusters

    def generate_demo_graph(self, user_id: str) -> KnowledgeGraph:
        """Generate a rich demonstration knowledge graph for initial state."""
        demo_nodes = [
            ConceptNode(id="linear_algebra", name="Linear Algebra", category="math", description="Vector spaces, matrices, linear transformations.", importance_score=0.95),
            ConceptNode(id="calculus", name="Multivariable Calculus", category="math", description="Partial derivatives, gradients, backprop math.", importance_score=0.9),
            ConceptNode(id="neural_networks", name="Neural Networks", category="architecture", description="Perceptrons, activation functions, loss curves.", importance_score=0.85),
            ConceptNode(id="gradient_descent", name="Gradient Descent", category="algorithm", description="Optimization algorithms, Adam, learning rate schedules.", importance_score=0.88),
            ConceptNode(id="transformers", name="Transformer Architecture", category="architecture", description="Self-attention mechanisms, multi-head attention, encoders/decoders.", importance_score=0.98),
            ConceptNode(id="rag_retrieval", name="RAG Vector Search", category="system", description="Dense embeddings, Qdrant hybrid retrieval, vector similarity.", importance_score=0.92),
            ConceptNode(id="langgraph_agents", name="LangGraph Agent Control", category="system", description="Stateful agentic graphs, checkpointing, node workflows.", importance_score=0.89),
        ]

        demo_edges = [
            ConceptRelationship(id="e1", source_concept_id="linear_algebra", target_concept_id="neural_networks", relation_type="prerequisite_of", description="Matrix multiplications form dense layers."),
            ConceptRelationship(id="e2", source_concept_id="calculus", target_concept_id="gradient_descent", relation_type="prerequisite_of", description="Partial derivatives compute gradients."),
            ConceptRelationship(id="e3", source_concept_id="gradient_descent", target_concept_id="neural_networks", relation_type="optimizes", description="Gradient descent updates weight parameters."),
            ConceptRelationship(id="e4", source_concept_id="neural_networks", target_concept_id="transformers", relation_type="extends", description="Transformers generalize deep neural architectures."),
            ConceptRelationship(id="e5", source_concept_id="transformers", target_concept_id="rag_retrieval", relation_type="enables", description="Transformer embeddings power vector search RAG."),
            ConceptRelationship(id="e6", source_concept_id="rag_retrieval", target_concept_id="langgraph_agents", relation_type="integrates_with", description="RAG context feeds deterministic agent state graphs."),
        ]

        nodes_dict = {n.id: n for n in demo_nodes}
        clusters = self._compute_clusters(nodes_dict, demo_edges)

        return KnowledgeGraph(
            id=f"graph_demo_{user_id[:8]}",
            user_id=user_id,
            nodes=demo_nodes,
            edges=demo_edges,
            clusters=clusters,
        )
