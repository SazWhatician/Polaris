import hashlib


def sha256_hex(data: bytes) -> str:
    """Stable content hash used for OCR idempotency."""
    return hashlib.sha256(data).hexdigest()
