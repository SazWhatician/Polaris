"""PaddleOCR adapter implementing ``OcrEngine``.

Heavy imports (paddleocr, numpy) live inside the class so the API container
— which doesn't install them — can still import this module if it needs to
(e.g. for type checks). The engine is built once per worker process by the
worker's ``_startup`` hook.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.services.ocr_service import PageOcrResult

if TYPE_CHECKING:
    from PIL.Image import Image as PILImage


class PaddleOcrEngine:
    name: str = "paddleocr-2.7"

    def __init__(self) -> None:
        self._impl: Any = None
        try:
            from paddleocr import PaddleOCR

            self._impl = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        except Exception:
            pass

    def ocr_image(self, image: PILImage) -> PageOcrResult:
        if self._impl is None:
            return PageOcrResult(text="", confidence=0.0)

        try:
            import numpy as np

            # PaddleOCR expects BGR numpy arrays.
            arr = np.array(image.convert("RGB"))[:, :, ::-1]
            result = self._impl.ocr(arr, cls=True)

            if not result or not result[0]:
                return PageOcrResult(text="", confidence=0.0)

            lines: list[str] = []
            confidences: list[float] = []
            for line in result[0]:
                text, conf = line[1]
                lines.append(text)
                confidences.append(float(conf))

            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            return PageOcrResult(text="\n".join(lines), confidence=avg_conf)
        except Exception:
            return PageOcrResult(text="", confidence=0.0)
