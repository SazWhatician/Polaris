from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Topic(BaseModel):
    id: str = Field(description="Unique identifier for the topic (e.g. slug or code)")
    title: str = Field(description="Short title of the topic")
    description: str | None = Field(
        None, description="Detailed description of what is covered in this topic"
    )
    subtopics: list[Topic] = Field(
        default_factory=list, description="Subtopics nested under this topic"
    )


# Rebuild the self-referential Pydantic model for nested subtopics
Topic.model_rebuild()


class Syllabus(BaseModel):
    id: str = Field(description="Unique ID of the syllabus")
    user_id: str = Field(description="User ID who owns this syllabus")
    name: str = Field(description="Display name of the course or syllabus")
    created_at: datetime = Field(description="Creation timestamp")
    updated_at: datetime = Field(description="Update timestamp")
    tree: list[Topic] = Field(default_factory=list, description="List of top-level topics")


class TopicCoverage(BaseModel):
    topic_id: str = Field(description="The ID of the topic")
    score: float = Field(description="Combined coverage score between 0.0 and 100.0")
    status: str = Field(description="Coverage status: 'good' (>=70), 'partial' (>=30), or 'none'")
    explanation: str = Field(
        description=(
            "Short explanation of how the score was calculated or what notes cover this topic"
        )
    )
    matched_chunks: list[dict[str, Any]] = Field(
        default_factory=list, description="List of matched notes chunk citations"
    )


class SyllabusCoverage(BaseModel):
    syllabus_id: str = Field(description="The ID of the syllabus")
    overall_score: float = Field(description="Average coverage score across all leaf topics")
    topics: dict[str, TopicCoverage] = Field(
        default_factory=dict, description="Map of topic_id to its TopicCoverage details"
    )
    updated_at: datetime = Field(description="Timestamp when the coverage was computed")


class SyllabusCreateRequest(BaseModel):
    name: str = Field(description="Display name of the course or syllabus")
    syllabus_text: str | None = Field(None, description="Raw pasted text of the syllabus")
    document_id: str | None = Field(
        None, description="Reference to a previously uploaded and OCR'd notes/syllabus document"
    )


class SyllabusResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    tree: list[Topic]


class SyllabusListResponse(BaseModel):
    items: list[SyllabusResponse]
