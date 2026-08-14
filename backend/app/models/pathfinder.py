from __future__ import annotations

from pydantic import BaseModel, Field


class RecommendedProject(BaseModel):
    title: str
    description: str


class CareerGoal(BaseModel):
    id: str
    title: str
    description: str
    required_skills: list[str] = Field(default_factory=list)
    recommended_projects: list[RecommendedProject] = Field(default_factory=list)
    milestones: list[str] = Field(default_factory=list)


class SkillGap(BaseModel):
    skill: str
    status: str = "missing"  # "ready" | "weak" | "missing"


class CareerPlan(BaseModel):
    career_goal: CareerGoal
    skill_gaps: list[SkillGap] = Field(default_factory=list)
    ready_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    readiness_score: float = 0.0  # 0.0 to 1.0
    recommended_projects: list[RecommendedProject] = Field(default_factory=list)
    learning_path: list[str] = Field(default_factory=list, description="Ordered list of skills to learn")
    summary: str = ""
