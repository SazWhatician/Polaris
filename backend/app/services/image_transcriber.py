"""Transcribes text from syllabus photos and scanned documents using vision LLM."""

from __future__ import annotations

import base64
import io
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

log = get_logger(__name__)


async def transcribe_image_bytes(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> str:
    """Transcribe all text from an image using NVIDIA NIM Vision LLM."""
    settings = get_settings()
    api_key = settings.nvidia_nim_api_key or ""
    # 1. Try NVIDIA NIM Vision
    if api_key:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        payload: dict[str, Any] = {
            "model": "meta/llama-3.2-11b-vision-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "You are an expert OCR transcription engine for academic documents. "
                                "Transcribe all text from this syllabus photo/document verbatim and accurately. "
                                "Include all course titles, units, modules, chapters, topics, subtopics, and descriptions. "
                                "Preserve the structure and layout. Output ONLY the extracted syllabus text."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                        },
                    ],
                }
            ],
            "temperature": 0.1,
            "max_tokens": 2048,
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                if res.status_code == 200:
                    data = res.json()
                    text = data["choices"][0]["message"]["content"].strip()
                    if text:
                        return text
        except Exception as exc:
            log.warning("nvidia_image_transcribe.failed", error=str(exc))

    # 2. Fallback to Gemini Vision if NIM is unavailable or fails
    gemini_text = await _transcribe_with_gemini(image_bytes, mime_type)
    if gemini_text:
        return gemini_text

    log.warning("image_transcribe.all_providers_exhausted")
    return ""


async def _transcribe_with_gemini(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Fallback transcription using Google Gemini Flash Multimodal Vision API."""
    settings = get_settings()
    keys = settings.parsed_gemini_api_keys
    if not keys:
        return ""

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    prompt = (
        "You are an expert OCR transcription engine for academic documents. "
        "Transcribe all text from this syllabus photo/document verbatim and accurately. "
        "Include all course titles, units, modules, chapters, topics, subtopics, and descriptions. "
        "Preserve the structure and layout. Output ONLY the extracted syllabus text."
    )

    for key in keys:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
        }
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
        except Exception as exc:
            log.warning("gemini_image_transcribe.attempt_failed", error=str(exc))

    return ""


async def transcribe_scanned_pdf_bytes(pdf_bytes: bytes, max_pages: int = 4) -> str:
    """Render pages of a scanned PDF as images and transcribe them."""
    try:
        import pypdfium2 as pdfium

        pdf = pdfium.PdfDocument(pdf_bytes)
        transcriptions: list[str] = []
        num_pages = min(len(pdf), max_pages)

        for i in range(num_pages):
            page = pdf[i]
            try:
                pil_image = page.render(scale=1.5).to_pil()
                buf = io.BytesIO()
                pil_image.save(buf, format="JPEG", quality=85)
                text = await transcribe_image_bytes(buf.getvalue(), mime_type="image/jpeg")
                if text:
                    transcriptions.append(text)
            finally:
                page.close()
        pdf.close()
        return "\n\n".join(transcriptions).strip()
    except Exception as exc:
        log.error("scanned_pdf_transcribe.failed", error=str(exc))
        return ""
