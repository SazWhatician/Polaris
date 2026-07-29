from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class StudyBlock(BaseModel):
    topic_id: str = Field(description="Unique topic ID from syllabus")
    topic_title: str = Field(description="Title of the topic to study")
    allocated_minutes: int = Field(description="Duration in minutes allocated to this topic block")
    priority: Literal["high", "medium", "low"] = Field(
        default="medium", description="Priority level of the topic"
    )
    notes: str = Field(default="", description="Study recommendation or instructions for this block")


class DaySchedule(BaseModel):
    date: str = Field(description="ISO date string YYYY-MM-DD")
    available_hours: float = Field(description="Available study hours for this day")
    blocks: list[StudyBlock] = Field(
        default_factory=list, description="List of scheduled study blocks for the day"
    )


class RevisionPlan(BaseModel):
    plan_id: str = Field(description="Unique plan identifier")
    user_id: str = Field(description="User ID owner of the plan")
    exam_date: str = Field(description="Target exam date YYYY-MM-DD")
    daily_hours: float = Field(description="Daily available study hours constraint")
    schedules: list[DaySchedule] = Field(
        default_factory=list, description="Day-by-day revision schedule"
    )
    total_hours_allocated: float = Field(
        default=0.0, description="Total hours allocated across all days"
    )
    created_at: str = Field(description="ISO timestamp when plan was generated")


class PlanDiffItem(BaseModel):
    topic_id: str = Field(description="Topic ID")
    topic_title: str = Field(description="Title of the topic")
    change_type: Literal["added", "removed", "rescheduled", "duration_changed"] = Field(
        description="Type of change detected"
    )
    old_date: str | None = Field(default=None, description="Previous scheduled date if applicable")
    new_date: str | None = Field(default=None, description="New scheduled date if applicable")
    old_minutes: int | None = Field(default=None, description="Previous allocated minutes")
    new_minutes: int | None = Field(default=None, description="New allocated minutes")
    details: str = Field(default="", description="Human-readable explanation of the change")


class PlanDiffResponse(BaseModel):
    old_plan_id: str = Field(description="Old plan ID compared")
    new_plan_id: str = Field(description="New plan ID compared")
    diffs: list[PlanDiffItem] = Field(
        default_factory=list, description="List of semantic diff items"
    )
