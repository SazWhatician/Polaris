from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, TypedDict

from app.models.planner import DaySchedule, RevisionPlan, StudyBlock
from app.repositories.plan_repo import PlanRepository
from langgraph.graph import END, START, StateGraph


class PlannerAgentState(TypedDict):
    user_id: str
    exam_date: str
    daily_hours: float
    topic_gaps: list[dict[str, Any]]

    schedules: list[dict[str, Any]]
    generated_plan: dict[str, Any] | None
    error: str | None


class PlannerAgent:
    def __init__(self, plan_repo: PlanRepository | None = None) -> None:
        self.plan_repo = plan_repo or PlanRepository()

    async def validate_inputs(self, state: PlannerAgentState) -> dict[str, Any]:
        """Validates exam date format and daily available hours constraint."""
        daily_hours = state.get("daily_hours", 0.0)
        if daily_hours <= 0:
            return {"error": "Daily hours must be greater than 0"}

        try:
            target_dt = datetime.strptime(state.get("exam_date", ""), "%Y-%m-%d").date()
            if target_dt < datetime.now(UTC).date():
                return {"error": "Exam date cannot be in the past"}
        except ValueError:
            return {"error": "Invalid exam date format. Expected YYYY-MM-DD"}

        return {"error": None}

    async def allocate_schedule(self, state: PlannerAgentState) -> dict[str, Any]:
        """Generates date slots from today up to the exam date."""
        if state.get("error"):
            return {}

        today = datetime.now(UTC).date()
        target_dt = datetime.strptime(state["exam_date"], "%Y-%m-%d").date()
        days_count = max(1, (target_dt - today).days)
        daily_hours = state["daily_hours"]

        schedules = [
            {
                "date": (today + timedelta(days=i)).strftime("%Y-%m-%d"),
                "available_hours": daily_hours,
                "blocks": [],
            }
            for i in range(days_count)
        ]
        return {"schedules": schedules}

    async def generate_plan(self, state: PlannerAgentState) -> dict[str, Any]:
        """Allocates weak and missing topics into available daily study blocks."""
        if state.get("error"):
            return {}

        schedules = state.get("schedules") or []
        if not schedules:
            return {"error": "No available schedules to allocate topics"}

        topic_gaps = state.get("topic_gaps") or [
            {"topic_id": "general_revision", "topic_title": "General Syllabus Revision", "priority": "high"}
        ]

        sorted_gaps = sorted(
            topic_gaps,
            key=lambda x: 0 if x.get("priority") == "high" else (1 if x.get("priority") == "medium" else 2),
        )

        total_allocated_hours = 0.0
        for day_idx, day_dict in enumerate(schedules):
            day_avail_mins = int(day_dict["available_hours"] * 60)
            gap = sorted_gaps[day_idx % len(sorted_gaps)]
            block_mins = min(day_avail_mins, 120)

            if block_mins > 0:
                day_dict["blocks"] = [
                    {
                        "topic_id": gap.get("topic_id", f"topic_{day_idx}"),
                        "topic_title": gap.get("topic_title", "Study Topic"),
                        "allocated_minutes": block_mins,
                        "priority": gap.get("priority", "medium"),
                        "notes": f"Focus revision on {gap.get('topic_title', 'topic')}.",
                    }
                ]
                total_allocated_hours += round(block_mins / 60.0, 2)

        plan_obj = RevisionPlan(
            plan_id=f"plan_{uuid.uuid4().hex[:12]}",
            user_id=state["user_id"],
            exam_date=state["exam_date"],
            daily_hours=state["daily_hours"],
            schedules=[DaySchedule(**s) for s in schedules],
            total_hours_allocated=round(total_allocated_hours, 2),
            created_at=datetime.now(UTC).isoformat(),
        )

        return {"generated_plan": plan_obj.model_dump()}

    async def save_plan(self, state: PlannerAgentState) -> dict[str, Any]:
        """Saves generated plan to repository."""
        plan_dict = state.get("generated_plan")
        if not state.get("error") and plan_dict:
            await self.plan_repo.save_plan(state["user_id"], RevisionPlan(**plan_dict))
        return {}

    def compile(self, checkpointer: Any = None) -> Any:
        workflow = StateGraph(PlannerAgentState)
        workflow.add_node("validate_inputs", self.validate_inputs)
        workflow.add_node("allocate_schedule", self.allocate_schedule)
        workflow.add_node("generate_plan", self.generate_plan)
        workflow.add_node("save_plan", self.save_plan)

        workflow.add_edge(START, "validate_inputs")
        workflow.add_edge("validate_inputs", "allocate_schedule")
        workflow.add_edge("allocate_schedule", "generate_plan")
        workflow.add_edge("generate_plan", "save_plan")
        workflow.add_edge("save_plan", END)

        return workflow.compile(checkpointer=checkpointer)
