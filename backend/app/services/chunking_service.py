"""Chunk page text into Qdrant-ready chunks.

We use LangChain's RecursiveCharacterTextSplitter because it preserves natural
boundaries (paragraph → sentence → word) better than fixed-size windows.
Chunk size 800 + overlap 100 is a starting point — tuned via eval (ADR 0008).
"""

from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.models.document import Page
from app.models.rag import Chunk


class ChunkingService:
    def __init__(self, *, chunk_size: int, chunk_overlap: int) -> None:
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def chunk_pages(self, pages: list[Page]) -> list[Chunk]:
        """One Page can produce many Chunks. We keep page_number on each so
        Qdrant retrieval surfaces citations down to the page."""
        out: list[Chunk] = []
        for page in pages:
            if not page.text.strip():
                continue
            for idx, text in enumerate(self._splitter.split_text(page.text)):
                out.append(
                    Chunk(
                        document_id=page.document_id,
                        page_number=page.page_number,
                        chunk_index=idx,
                        text=text,
                    )
                )
        return out
