from __future__ import annotations

from typing import Any
from app.models.planner import PlanDiffItem, PlanDiffResponse, RevisionPlan


def _extract_topics(plan: RevisionPlan) -> dict[str, dict[str, Any]]:
    topics: dict[str, dict[str, Any]] = {}
    for day in plan.schedules:
        for block in day.blocks:
            if block.topic_id not in topics:
                topics[block.topic_id] = {
                    "topic_title": block.topic_title,
                    "date": day.date,
                    "minutes": block.allocated_minutes,
                }
            else:
                topics[block.topic_id]["minutes"] += block.allocated_minutes
    return topics


def compute_plan_diff(old_plan: RevisionPlan, new_plan: RevisionPlan) -> PlanDiffResponse:
    """Computes deterministic semantic diff between two RevisionPlan instances."""
    old_topics = _extract_topics(old_plan)
    new_topics = _extract_topics(new_plan)
    diffs: list[PlanDiffItem] = []

    # Removed topics
    for t_id, old_data in old_topics.items():
        if t_id not in new_topics:
            diffs.append(
                PlanDiffItem(
                    topic_id=t_id,
                    topic_title=old_data["topic_title"],
                    change_type="removed",
                    old_date=old_data["date"],
                    old_minutes=old_data["minutes"],
                    details=f"Topic '{old_data['topic_title']}' removed from revision schedule.",
                )
            )

    # Added or modified topics
    for t_id, new_data in new_topics.items():
        if t_id not in old_topics:
            diffs.append(
                PlanDiffItem(
                    topic_id=t_id,
                    topic_title=new_data["topic_title"],
                    change_type="added",
                    new_date=new_data["date"],
                    new_minutes=new_data["minutes"],
                    details=f"Topic '{new_data['topic_title']}' added to revision schedule on {new_data['date']}.",
                )
            )
        else:
            old_data = old_topics[t_id]
            date_changed = old_data["date"] != new_data["date"]
            minutes_changed = old_data["minutes"] != new_data["minutes"]

            if date_changed:
                diffs.append(
                    PlanDiffItem(
                        topic_id=t_id,
                        topic_title=new_data["topic_title"],
                        change_type="rescheduled",
                        old_date=old_data["date"],
                        new_date=new_data["date"],
                        old_minutes=old_data["minutes"],
                        new_minutes=new_data["minutes"],
                        details=f"Rescheduled '{new_data['topic_title']}' from {old_data['date']} to {new_data['date']}.",
                    )
                )
            elif minutes_changed:
                diffs.append(
                    PlanDiffItem(
                        topic_id=t_id,
                        topic_title=new_data["topic_title"],
                        change_type="duration_changed",
                        old_date=old_data["date"],
                        new_date=new_data["date"],
                        old_minutes=old_data["minutes"],
                        new_minutes=new_data["minutes"],
                        details=f"Adjusted duration for '{new_data['topic_title']}' from {old_data['minutes']}m to {new_data['minutes']}m.",
                    )
                )

    return PlanDiffResponse(
        old_plan_id=old_plan.plan_id,
        new_plan_id=new_plan.plan_id,
        diffs=diffs,
    )
