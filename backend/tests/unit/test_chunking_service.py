from datetime import UTC, datetime

from app.models.document import Page
from app.services.chunking_service import ChunkingService


def _page(num: int, text: str) -> Page:
    return Page(
        document_id="d1",
        page_number=num,
        text=text,
        confidence=0.9,
        ocr_engine="test",
        processed_at=datetime.now(UTC),
    )


def test_short_page_produces_single_chunk() -> None:
    svc = ChunkingService(chunk_size=800, chunk_overlap=100)
    chunks = svc.chunk_pages([_page(1, "hello world")])
    assert len(chunks) == 1
    assert chunks[0].text == "hello world"
    assert chunks[0].page_number == 1
    assert chunks[0].chunk_index == 0


def test_long_page_splits_into_multiple_chunks_with_overlap() -> None:
    svc = ChunkingService(chunk_size=50, chunk_overlap=10)
    long_text = " ".join([f"word{i}" for i in range(60)])  # ~400 chars
    chunks = svc.chunk_pages([_page(1, long_text)])
    assert len(chunks) > 1
    # chunk indices are dense + start at 0.
    assert [c.chunk_index for c in chunks] == list(range(len(chunks)))
    # All chunks bear the same page_number.
    assert all(c.page_number == 1 for c in chunks)
    # Each chunk fits inside chunk_size + a little slack for separator awareness.
    assert all(len(c.text) <= 60 for c in chunks)


def test_empty_pages_are_skipped() -> None:
    svc = ChunkingService(chunk_size=800, chunk_overlap=100)
    chunks = svc.chunk_pages([_page(1, ""), _page(2, "   \n\n"), _page(3, "real content")])
    assert len(chunks) == 1
    assert chunks[0].page_number == 3


def test_multiple_pages_keep_their_own_page_numbers() -> None:
    svc = ChunkingService(chunk_size=800, chunk_overlap=100)
    chunks = svc.chunk_pages([_page(1, "page one"), _page(2, "page two"), _page(5, "page five")])
    assert [c.page_number for c in chunks] == [1, 2, 5]
