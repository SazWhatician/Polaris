from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, PositiveInt


class DocumentStatus(StrEnum):
    REQUESTED = "requested"  # upload URL issued; blob may not exist yet
    UPLOADED = "uploaded"  # blob present in storage
    QUEUED = "queued"  # OCR queued
    PROCESSING = "processing"  # OCR running
    OCR_COMPLETE = "ocr_complete"  # text extracted; ingest pending
    INDEXING = "indexing"  # chunking + embedding + Qdrant upsert in flight
    INDEXED = "indexed"  # ready for chat
    FAILED = "failed"  # any stage failed


# A small whitelist of mime types the system accepts.
ALLOWED_MIME_TYPES: frozenset[str] = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    }
)


class DocumentBase(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    mime_type: str
    size_bytes: PositiveInt


class DocumentCreateRequest(DocumentBase):
    """Body of POST /api/documents — asks for a signed upload URL."""


class DocumentCreateResponse(BaseModel):
    document_id: str
    upload_url: str
    storage_path: str
    expires_in_seconds: int
    method: str = "PUT"
    required_headers: dict[str, str] = Field(
        default_factory=dict,
        description="Headers the client MUST send with the PUT to match the signed URL signature.",
    )


class Document(DocumentBase):
    """Domain model — what we persist to Firestore."""

    model_config = ConfigDict(frozen=False)

    id: str
    user_id: str
    status: DocumentStatus = DocumentStatus.REQUESTED
    storage_path: str
    content_hash: str | None = None
    page_count: int | None = None
    ocr_completed_at: datetime | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentResponse(Document):
    """Wire shape; identical for now but kept distinct so we can hide
    fields (e.g. storage_path) later without changing the domain model."""


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    next_cursor: str | None = None


class Page(BaseModel):
    """A single OCR'd page persisted at users/{uid}/documents/{docId}/pages/{N}."""

    document_id: str
    page_number: int = Field(ge=1)
    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    ocr_engine: str
    processed_at: datetime


class PageListResponse(BaseModel):
    items: list[Page]
