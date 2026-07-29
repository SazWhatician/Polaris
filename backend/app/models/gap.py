from __future__ import annotations

from pydantic import BaseModel, Field


class GapRecommendation(BaseModel):
    topic_id: str = Field(description="The ID of the topic")
    title: str = Field(description="The title of the topic")
    status: str = Field(description="The status of the topic: 'weak' or 'missing'")
    reason: str = Field(description="Why this topic is recommended for study now")
    actionable_steps: list[str] = Field(
        default_factory=list,
        description="Actionable study steps or subtopics to focus on",
    )
    estimated_hours: float = Field(description="Estimated study hours needed to cover this gap")


class GapAnalysisResponse(BaseModel):
    syllabus_id: str = Field(description="The ID of the syllabus")
    gaps: dict[str, str] = Field(
        default_factory=dict,
        description="Map of topic_id to status ('known', 'weak', 'missing')",
    )
    prerequisites: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Map of topic_id to its prerequisite topic_ids",
    )
    recommendations: list[GapRecommendation] = Field(
        default_factory=list,
        description="Ordered list of study recommendations",
    )
    updated_at: str = Field(description="ISO timestamp when the gap analysis was completed")
