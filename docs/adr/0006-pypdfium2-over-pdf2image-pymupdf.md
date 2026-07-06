# 0006. pypdfium2 for PDF page rendering (over pdf2image and PyMuPDF)

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
PaddleOCR consumes images, not PDFs. We need to render every PDF page to a PIL Image before OCR. The Python ecosystem offers three serious options:

1. **pdf2image** — wraps `poppler-utils`. Requires installing Poppler as a system package.
2. **PyMuPDF (`fitz`)** — fast, batteries-included PDF library. License: **AGPL-3.0** (or commercial).
3. **pypdfium2** — Python bindings around Google's PDFium engine (the renderer inside Chromium). License: Apache-2.0/BSD-3. Ships precompiled wheels with the binary included.

## Decision
Use **pypdfium2**.

## Alternatives Considered
- **pdf2image + Poppler**
  - Pros: well-understood; very common in Python OCR pipelines.
  - Cons: adds `apt-get install poppler-utils` to the Dockerfile (~30 MB + a recurring source of CVE patches); cross-platform issues (Windows native runs require a separate Poppler binary on PATH); slower than pypdfium2 in our quick microbench.
- **PyMuPDF**
  - Pros: fastest of the three; richest PDF API.
  - Cons: AGPL-3.0. A portfolio project posted publicly with AGPL deps would force the AGPL onto downstream forkers, which is not a default I want to impose. Commercial licensing exists but isn't free.
- **pdfplumber / pikepdf / pdfminer.six**
  - These are text-extraction libraries, not renderers. Out of scope for OCR.

## Consequences
**Positive**
- Zero system deps in the Dockerfile. The pypdfium2 wheel includes the binary; no Poppler, no font dirs, no surprises.
- Apache/BSD license matches the project's MIT license posture.
- API is small and explicit (`PdfDocument`, `page.render(scale=...).to_pil()`); easy to test with `_make_tiny_pdf` fixtures.
- Same library handles future needs we'd otherwise have to bolt on (e.g., page count for pagination cheap by `len(pdf)` without rendering).

**Negative / tradeoffs accepted**
- Smaller ecosystem and less StackOverflow material than pdf2image. Acceptable: the surface we use is tiny.
- pypdfium2 binary size adds ~8 MB to the image. Trivial vs PaddleOCR's 500 MB.
- Render quality is excellent but not identical to Poppler for edge-case PDFs (unusual ICC color spaces). If OCR quality regresses on a specific document type, swap is a one-file change in `app/services/page_extractor.py`.

**Revisit triggers**
- We encounter a PDF that pypdfium2 mis-renders and pdf2image gets right.
- pypdfium2 abandons its precompiled wheel strategy (currently very active upstream).
