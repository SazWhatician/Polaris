from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, TypedDict

from app.models.pathfinder import CareerGoal, CareerPlan, RecommendedProject, SkillGap
from app.repositories.graph_repo import GraphRepository
from app.services.twin_service import TwinService
from langgraph.graph import END, START, StateGraph

logger = logging.getLogger(__name__)

_ROADMAPS_PATH = Path(__file__).resolve().parent.parent / "data" / "career_roadmaps.json"


def load_career_roadmaps() -> list[dict[str, Any]]:
    """Load seed career roadmaps from JSON."""
    if _ROADMAPS_PATH.is_file():
        try:
            return json.loads(_ROADMAPS_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Failed to load career_roadmaps.json: %s", e)
    return []


class PathfinderAgentState(TypedDict):
    user_id: str
    career_goal_id: str

    career_goal: dict[str, Any] | None
    twin_data: dict[str, Any] | None
    skill_analysis: dict[str, Any] | None
    career_plan: dict[str, Any] | None
    error: str | None


class PathfinderAgent:
    """Multi-agent composer: loads career roadmap → analyzes skills via twin → generates career plan."""

    def __init__(
        self,
        twin_service: TwinService | None = None,
        graph_repo: GraphRepository | None = None,
    ) -> None:
        self.twin_service = twin_service or TwinService()
        self.graph_repo = graph_repo or GraphRepository()

    async def load_career_goal(self, state: PathfinderAgentState) -> dict[str, Any]:
        """Load the selected career roadmap from seed data."""
        roadmaps = load_career_roadmaps()
        goal_id = state["career_goal_id"]

        for roadmap in roadmaps:
            if roadmap["id"] == goal_id:
                return {"career_goal": roadmap, "error": None}

        available = [r["id"] for r in roadmaps]
        return {"error": f"Career goal '{goal_id}' not found. Available: {available}"}

    async def analyze_skills(self, state: PathfinderAgentState) -> dict[str, Any]:
        """Compare career required skills against user's known concepts from the twin."""
        if state.get("error"):
            return {}

        career_goal = state.get("career_goal") or {}
        required_skills = career_goal.get("required_skills", [])

        # Get the user's twin to see what they know
        twin = await self.twin_service.get_twin(state["user_id"])
        known_set = set(s.lower() for s in twin.known_concepts)
        weak_set = set(s.lower() for s in twin.weak_concepts)

        # Also check knowledge graph nodes
        graph = self.graph_repo.get_latest_graph(state["user_id"])
        graph_known = set()
        if graph:
            graph_known = set(n.name.lower() for n in graph.nodes)

        all_known = known_set | graph_known

        ready_skills: list[str] = []
        weak_skills: list[str] = []
        missing_skills: list[str] = []
        skill_gaps: list[dict] = []

        for skill in required_skills:
            skill_lower = skill.lower()
            if skill_lower in all_known:
                ready_skills.append(skill)
                skill_gaps.append({"skill": skill, "status": "ready"})
            elif skill_lower in weak_set:
                weak_skills.append(skill)
                skill_gaps.append({"skill": skill, "status": "weak"})
            else:
                missing_skills.append(skill)
                skill_gaps.append({"skill": skill, "status": "missing"})

        readiness_score = len(ready_skills) / max(1, len(required_skills))

        return {
            "twin_data": twin.model_dump(),
            "skill_analysis": {
                "skill_gaps": skill_gaps,
                "ready_skills": ready_skills,
                "weak_skills": weak_skills,
                "missing_skills": missing_skills,
                "readiness_score": round(readiness_score, 2),
            },
        }

    async def compose_plan(self, state: PathfinderAgentState) -> dict[str, Any]:
        """Compose the final career plan from skill analysis + career goal data."""
        if state.get("error"):
            return {}

        career_goal_data = state.get("career_goal") or {}
        skill_analysis = state.get("skill_analysis") or {}

        ready = skill_analysis.get("ready_skills", [])
        missing = skill_analysis.get("missing_skills", [])
        weak = skill_analysis.get("weak_skills", [])
        readiness_score = skill_analysis.get("readiness_score", 0.0)

        # Learning path: weak first (reinforce), then missing (learn new)
        learning_path = weak + missing

        # Build summary
        total = len(ready) + len(weak) + len(missing)
        if readiness_score >= 0.8:
            summary = f"You're well-positioned for {career_goal_data.get('title', 'this role')}! {len(ready)}/{total} skills are ready. Focus on strengthening {len(weak)} weak areas."
        elif readiness_score >= 0.4:
            summary = f"Good progress toward {career_goal_data.get('title', 'this role')}. {len(ready)}/{total} skills ready, {len(missing)} to learn. Follow the learning path below."
        else:
            summary = f"Starting your journey toward {career_goal_data.get('title', 'this role')}. {len(missing)}/{total} skills need work. The learning path prioritizes fundamentals first."

        career_goal = CareerGoal(
            id=career_goal_data.get("id", ""),
            title=career_goal_data.get("title", ""),
            description=career_goal_data.get("description", ""),
            required_skills=career_goal_data.get("required_skills", []),
            recommended_projects=[
                RecommendedProject(**p) for p in career_goal_data.get("recommended_projects", [])
            ],
            milestones=career_goal_data.get("milestones", []),
        )

        plan = CareerPlan(
            career_goal=career_goal,
            skill_gaps=[SkillGap(**sg) for sg in skill_analysis.get("skill_gaps", [])],
            ready_skills=ready,
            missing_skills=missing,
            readiness_score=readiness_score,
            recommended_projects=career_goal.recommended_projects,
            learning_path=learning_path,
            summary=summary,
        )

        return {"career_plan": plan.model_dump()}

    def compile(self, checkpointer: Any = None) -> Any:
        workflow = StateGraph(PathfinderAgentState)
        workflow.add_node("load_career_goal", self.load_career_goal)
        workflow.add_node("analyze_skills", self.analyze_skills)
        workflow.add_node("compose_plan", self.compose_plan)

        workflow.add_edge(START, "load_career_goal")
        workflow.add_edge("load_career_goal", "analyze_skills")
        workflow.add_edge("analyze_skills", "compose_plan")
        workflow.add_edge("compose_plan", END)

        return workflow.compile(checkpointer=checkpointer)
