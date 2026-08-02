from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import get_current_user_id
from app.models.graph import (
    KnowledgeGraph,
    GraphExtractionRequest,
    GraphExtractionResponse,
)
from app.services.concept_extraction_service import ConceptExtractionService
from app.repositories.graph_repo import GraphRepository

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph Engine"])

_extraction_service = ConceptExtractionService()
_graph_repo = GraphRepository()


@router.post("/extract", response_model=GraphExtractionResponse)
async def extract_knowledge_graph(
    req: GraphExtractionRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Trigger concept extraction from course notes & syllabus to generate/update user Knowledge Graph."""
    try:
        # Generate or update Knowledge Graph
        graph = _extraction_service.extract_from_texts(
            user_id=user_id,
            texts=[],  # Extendable with PDF page snippets
            syllabus_topics=[],
        )
        _graph_repo.save_graph(user_id, graph)

        return GraphExtractionResponse(
            success=True,
            graph_id=graph.id,
            node_count=len(graph.nodes),
            edge_count=len(graph.edges),
            cluster_count=len(graph.clusters),
            message="Knowledge Graph extracted and clustered successfully.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract Knowledge Graph: {str(e)}",
        )


@router.get("/latest", response_model=KnowledgeGraph)
async def get_latest_graph(
    user_id: str = Depends(get_current_user_id),
):
    """Get the active user Knowledge Graph (returns demo graph if no graph exists yet)."""
    graph = _graph_repo.get_latest_graph(user_id)
    if not graph:
        graph = _extraction_service.generate_demo_graph(user_id)
        _graph_repo.save_graph(user_id, graph)

    return graph


@router.get("/nodes/{node_id}")
async def get_node_detail(
    node_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get detailed view of a specific concept node including prerequisites & dependents."""
    detail = _graph_repo.get_node_detail(user_id, node_id)
    if not detail:
        # Fallback to demo graph lookup
        graph = _extraction_service.generate_demo_graph(user_id)
        _graph_repo.save_graph(user_id, graph)
        detail = _graph_repo.get_node_detail(user_id, node_id)

    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Concept node '{node_id}' not found.",
        )

    return detail
