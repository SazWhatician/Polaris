"""End-to-end test of the OCR service against the real page_extractor.

Marked `slow` and `integration` so the default `pytest` run skips it.
Opt in with:  pytest -m integration

Uses pypdfium2 to build a 1-page PDF in-memory, then runs OcrService.process
with a FakeOcrEngine — exercising the full pipeline minus PaddleOCR itself."""

from __future__ import annotations

import io
from datetime import UTC, datetime

import pytest

pypdfium2 = pytest.importorskip("pypdfium2")
PIL_Image = pytest.importorskip("PIL.Image")

from app.models.document import Document, DocumentStatus
from app.services.ocr_service import OcrService

from tests.unit.test_ocr_service import FakeDocRepo, FakeEngine, FakePageRepo, FakeStorage

pytestmark = [pytest.mark.integration, pytest.mark.slow]


def _make_one_page_pdf() -> bytes:
    pdf = pypdfium2.PdfDocument.new()
    pdf.new_page(300, 300)
    buf = io.BytesIO()
    pdf.save(buf)
    pdf.close()
    return buf.getvalue()


async def test_end_to_end_with_real_pdf_render() -> None:
    pdf_bytes = _make_one_page_pdf()
    now = datetime.now(UTC)
    doc = Document(
        id="d1",
        user_id="alice",
        filename="t.pdf",
        mime_type="application/pdf",
        size_bytes=len(pdf_bytes),
        status=DocumentStatus.QUEUED,
        storage_path="users/alice/d1/t.pdf",
        created_at=now,
        updated_at=now,
    )

    svc = OcrService(
        doc_repo=FakeDocRepo({("alice", "d1"): doc}),  # type: ignore[arg-type]
        page_repo=FakePageRepo(),  # type: ignore[arg-type]
        storage=FakeStorage({"users/alice/d1/t.pdf": pdf_bytes}),  # type: ignore[arg-type]
        engine=FakeEngine(),
        max_pages=10,
        render_scale=1.0,
    )
    result = await svc.process("alice", "d1")
    assert result["page_count"] == 1
