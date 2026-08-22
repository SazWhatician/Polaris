"""Supabase Python Client initialization and singleton access."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.core.logging import get_logger

log = get_logger(__name__)

_supabase_client: Any = None
_initialized: bool = False
_settings: Settings | None = None


def initialize_supabase(settings: Settings) -> bool:
    """Initialize the Supabase Python Client singleton.

    Returns True if initialized successfully or running in local dev fallback mode.
    """
    global _supabase_client, _initialized, _settings
    if _initialized and _supabase_client is not None:
        return True

    _settings = settings
    url = settings.supabase_url
    key = settings.supabase_key or settings.supabase_anon_key

    if not url or url.startswith("http://placeholder") or not key or key == "placeholder":
        log.info(
            "supabase.local_mode",
            message="No Supabase credentials configured. Running in local filesystem & memory mode.",
        )
        _initialized = True
        _supabase_client = None
        return True

    try:
        from supabase import Client, create_client

        _supabase_client = create_client(url, key)
        _initialized = True
        log.info("supabase.initialized", url=url, bucket=settings.supabase_storage_bucket)
        return True
    except Exception as exc:
        log.warning("supabase.init_failed", error=str(exc), fallback="local_mode")
        _initialized = True
        _supabase_client = None
        return True


def is_initialized() -> bool:
    return _initialized


def get_supabase_client() -> Any:
    """Return the active Supabase client instance or None in local fallback mode."""
    return _supabase_client
