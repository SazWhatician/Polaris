from __future__ import annotations

from datetime import datetime, UTC
from typing import Literal

from pydantic import BaseModel, Field


class TwinSignal(BaseModel):
    """A passive study signal from the extension or internal events."""

    source: Literal["chat", "ocr", "syllabus", "extension"] = "chat"
    concept_id: str | None = None
    topic_id: str | None = None
    url_hash: str | None = None
    domain: str | None = None
    similarity: float | None = None
    engagement: dict | None = None
    occurred_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class VelocityPoint(BaseModel):
    """Single data point for learning velocity time-series."""

    week: str  # ISO week e.g. "2026-W33"
    concepts_learned: int = 0


class AcademicTwin(BaseModel):
    """Persistent model of a user's academic knowledge state."""

    user_id: str
    known_concepts: list[str] = Field(default_factory=list)
    weak_concepts: list[str] = Field(default_factory=list)
    missing_concepts: list[str] = Field(default_factory=list)
    velocity: list[VelocityPoint] = Field(default_factory=list)
    signals_count: int = 0
    last_updated: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())


class ReadinessQuery(BaseModel):
    """Request: Can I learn concept X?"""

    concept: str = Field(description="The concept or topic the user wants to learn")


class PrerequisiteStatus(BaseModel):
    concept_id: str
    name: str
    status: Literal["ready", "missing"] = "missing"


class ReadinessResult(BaseModel):
    """Response: prerequisite breakdown for a target concept."""

    target_concept: str
    ready: bool = False
    ready_prerequisites: list[PrerequisiteStatus] = Field(default_factory=list)
    missing_prerequisites: list[PrerequisiteStatus] = Field(default_factory=list)
    summary: str = ""
