from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ResourceItem(BaseModel):
    title: str = Field(description="Title of the educational resource")
    video_id: str = Field(description="YouTube video ID or unique resource identifier")
    url: str = Field(description="Direct URL to watch or access the resource")
    channel_title: str = Field(description="Name of the content creator or channel")
    thumbnail_url: str = Field(description="URL to the resource thumbnail image")
    duration: str = Field(default="N/A", description="Duration string (e.g. 14:20)")
    publication_date: str = Field(default="", description="ISO publication date string")
    view_count: int = Field(default=0, description="View count if available")
    description: str = Field(default="", description="Short snippet description of the video")
    rank_score: float = Field(default=0.0, description="Relevance and quality score (0.0 to 1.0)")
    why_recommended: str = Field(
        default="", description="LLM-generated rationale on why this video fits the topic"
    )


class ResourceDiscoveryRequest(BaseModel):
    topic_id: str = Field(description="ID of the syllabus topic")
    topic_title: str = Field(description="Title or topic name to search resources for")
    keywords: list[str] = Field(
        default_factory=list,
        description="Optional additional search keywords or context terms",
    )


class ResourceDiscoveryResponse(BaseModel):
    topic_id: str = Field(description="ID of the syllabus topic")
    topic_title: str = Field(description="Title of the topic")
    resources: list[ResourceItem] = Field(
        default_factory=list, description="Ranked list of educational resources"
    )
    from_cache: bool = Field(default=False, description="Whether results came from Firestore cache")
    updated_at: str = Field(description="ISO timestamp when discovery was completed")


class CachedTopicResources(BaseModel):
    topic_hash: str = Field(description="SHA256 hash of normalized topic title")
    topic_id: str = Field(description="Topic ID")
    topic_title: str = Field(description="Topic title")
    resources: list[dict[str, Any]] = Field(
        default_factory=list, description="List of resource dicts"
    )
    cached_at: str = Field(description="ISO timestamp when cached")
    expires_at: str = Field(description="ISO timestamp when cache entry expires")
