"""Exercises the page extractor against tiny generated PDFs + images.

Skipped if pypdfium2 / Pillow aren't installed (true in the lean prod API
image; true with our requirements.txt + dev install)."""

from __future__ import annotations

import io

import pytest

pypdfium2 = pytest.importorskip("pypdfium2")
PIL_Image = pytest.importorskip("PIL.Image")
from app.services.page_extractor import UnsupportedMimeTypeError, extract_pages
from PIL import Image  # type: ignore  # noqa: E402


def _make_png_bytes(color: str = "white") -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), color=color).save(buf, format="PNG")
    return buf.getvalue()


def _make_tiny_pdf(page_count: int = 3) -> bytes:
    """Build an in-memory PDF with N blank pages using pypdfium2's helpers.

    pypdfium2 doesn't expose a write API directly, so we use its bundled
    helper to create pages. For tests we synthesize via PIL + a quick
    `PdfDocument.new()` flow."""
    pdf = pypdfium2.PdfDocument.new()
    for _ in range(page_count):
        # Letter-ish size in PDF user units.
        pdf.new_page(612, 792)
    buf = io.BytesIO()
    pdf.save(buf)
    pdf.close()
    return buf.getvalue()


def test_image_extracted_as_single_page() -> None:
    pages = extract_pages(_make_png_bytes(), "image/png")
    assert len(pages) == 1
    assert pages[0].mode == "RGB"
    assert pages[0].size == (32, 32)


def test_pdf_extracted_as_n_pages() -> None:
    pdf_bytes = _make_tiny_pdf(page_count=4)
    pages = extract_pages(pdf_bytes, "application/pdf", render_scale=1.0)
    assert len(pages) == 4
    assert all(p.mode == "RGB" for p in pages)
    # Default render at scale=1.0 produces images sized to PDF page dims.
    assert all(p.size[0] > 0 and p.size[1] > 0 for p in pages)


def test_unsupported_mime_raises() -> None:
    with pytest.raises(UnsupportedMimeTypeError):
        extract_pages(b"junk", "application/zip")
