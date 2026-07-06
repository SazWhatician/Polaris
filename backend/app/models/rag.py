from pydantic import BaseModel, Field


class Chunk(BaseModel):
    """A chunk of text from one document page, ready to be embedded + stored."""

    document_id: str
    page_number: int = Field(ge=1)
    chunk_index: int = Field(ge=0)
    text: str


class RetrievedChunk(BaseModel):
    """A chunk that came back from Qdrant search — includes provenance + score."""

    document_id: str
    document_filename: str
    page_number: int
    chunk_index: int
    text: str
    score: float


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    document_ids: list[str] | None = None  # optional scope to specific docs
    top_k: int | None = None  # override default if specified


class Citation(BaseModel):
    """Payload sent to the client alongside the answer stream."""

    document_id: str
    document_filename: str
    page_number: int
    chunk_index: int
    text: str
    score: float
