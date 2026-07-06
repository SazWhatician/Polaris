"""Source bytes -> list of PIL Images, one per page.

Heavy deps (pypdfium2, PIL) are imported lazily so this module is import-safe
in the API container, which doesn't install them. Only the worker calls these
functions for real.
"""

from __future__ import annotations

from io import BytesIO
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL.Image import Image as PILImage


class UnsupportedMimeTypeError(Exception):
    pass


def extract_pages(
    blob_bytes: bytes, mime_type: str, *, render_scale: float = 2.0
) -> list[PILImage]:
    """Return one PIL Image per page of the source document.

    PDFs: rendered with pypdfium2 at ``render_scale`` × default DPI.
    Images: returned as a single-item list.
    """
    if mime_type == "application/pdf":
        return _render_pdf_pages(blob_bytes, render_scale=render_scale)
    if mime_type.startswith("image/"):
        from PIL import Image

        return [Image.open(BytesIO(blob_bytes)).convert("RGB")]
    raise UnsupportedMimeTypeError(mime_type)


def _render_pdf_pages(blob_bytes: bytes, *, render_scale: float) -> list[PILImage]:
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(blob_bytes)
    images: list[PILImage] = []
    try:
        for i in range(len(pdf)):
            page = pdf[i]
            pil_image = page.render(scale=render_scale).to_pil()
            images.append(pil_image.convert("RGB"))
            page.close()
    finally:
        pdf.close()
    return images
