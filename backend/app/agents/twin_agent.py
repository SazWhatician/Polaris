from __future__ import annotations

from typing import Any, TypedDict

from app.repositories.graph_repo import GraphRepository
from app.services.twin_service import TwinService
from langgraph.graph import END, START, StateGraph


class TwinAgentState(TypedDict):
    user_id: str
    target_concept: str

    twin_data: dict[str, Any] | None
    graph_data: dict[str, Any] | None
    readiness: dict[str, Any] | None
    error: str | None


class TwinAgent:
    """LangGraph agent that answers readiness queries via graph traversal + twin state."""

    def __init__(
        self,
        twin_service: TwinService | None = None,
        graph_repo: GraphRepository | None = None,
    ) -> None:
        self.twin_service = twin_service or TwinService()
        self.graph_repo = graph_repo or GraphRepository()

    async def load_twin(self, state: TwinAgentState) -> dict[str, Any]:
        try:
            twin = await self.twin_service.get_twin(state["user_id"])
            return {"twin_data": twin.model_dump(), "error": None}
        except Exception as e:
            return {"error": f"Failed to load twin: {e}"}

    async def load_graph(self, state: TwinAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}
        graph = self.graph_repo.get_latest_graph(state["user_id"])
        if not graph:
            return {"error": "No knowledge graph found. Upload notes and extract concepts first."}
        return {"graph_data": {"node_count": len(graph.nodes), "edge_count": len(graph.edges)}}

    async def check_readiness(self, state: TwinAgentState) -> dict[str, Any]:
        if state.get("error"):
            return {}

        # Resolve target concept to a node ID
        target = state["target_concept"].strip().lower()
        graph = self.graph_repo.get_latest_graph(state["user_id"])
        if not graph:
            return {"error": "No knowledge graph available."}

        # Fuzzy match: find the best-matching node
        matched_id = None
        for node in graph.nodes:
            if target in node.name.lower() or target in node.id:
                matched_id = node.id
                break

        if not matched_id:
            # Fall back to first node that contains the search term
            for node in graph.nodes:
                if any(word in node.name.lower() for word in target.split()):
                    matched_id = node.id
                    break

        if not matched_id:
            return {
                "readiness": {
                    "target_concept": state["target_concept"],
                    "ready": False,
                    "ready_prerequisites": [],
                    "missing_prerequisites": [],
                    "summary": f"Concept '{state['target_concept']}' not found in your knowledge graph.",
                }
            }

        result = self.twin_service.check_readiness(state["user_id"], matched_id)
        return {"readiness": result}

    def compile(self, checkpointer: Any = None) -> Any:
        workflow = StateGraph(TwinAgentState)
        workflow.add_node("load_twin", self.load_twin)
        workflow.add_node("load_graph", self.load_graph)
        workflow.add_node("check_readiness", self.check_readiness)

        workflow.add_edge(START, "load_twin")
        workflow.add_edge("load_twin", "load_graph")
        workflow.add_edge("load_graph", "check_readiness")
        workflow.add_edge("check_readiness", END)

        return workflow.compile(checkpointer=checkpointer)
