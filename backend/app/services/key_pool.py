"""API Key Pool manager for rotation and rate-limit cooldown handling."""

from __future__ import annotations

import asyncio
import time
from collections.abc import Sequence

from app.core.logging import get_logger

log = get_logger(__name__)


class KeyPoolEmptyError(Exception):
    """Raised when no API keys are provided to the KeyPool."""


class AllKeysOnCooldownError(Exception):
    """Raised when all API keys in the pool are on active rate-limit cooldown."""


class KeyPool:
    """Manages a pool of API keys with round-robin rotation and cooldown handling."""

    def __init__(self, keys: Sequence[str], *, default_cooldown_seconds: float = 60.0) -> None:
        cleaned_keys = [k.strip() for k in keys if k and k.strip()]
        if not cleaned_keys:
            raise KeyPoolEmptyError("KeyPool initialized with no valid API keys.")
        self._keys: list[str] = cleaned_keys
        self._default_cooldown = default_cooldown_seconds
        self._cooldowns: dict[str, float] = {}  # key -> cooldown end timestamp
        self._index: int = 0
        self._lock = asyncio.Lock()

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    async def get_next_key(self) -> str:
        """Returns the next available key that is not on cooldown.

        If all keys are on cooldown, raises AllKeysOnCooldownError.
        """
        async with self._lock:
            now = time.monotonic()
            # Clean up expired cooldowns
            self._cooldowns = {k: expiry for k, expiry in self._cooldowns.items() if expiry > now}

            n = len(self._keys)
            for _ in range(n):
                key = self._keys[self._index]
                self._index = (self._index + 1) % n
                if key not in self._cooldowns:
                    return key

            # All keys are on cooldown
            min_wait = min(self._cooldowns.values()) - now if self._cooldowns else 0.0
            log.warning("key_pool.all_on_cooldown", min_wait_seconds=round(min_wait, 2))
            raise AllKeysOnCooldownError(
                f"All {len(self._keys)} API keys are on cooldown. Minimum wait: {min_wait:.1f}s"
            )

    async def mark_cooldown(self, key: str, duration_seconds: float | None = None) -> None:
        """Marks a key as on cooldown for specified duration (or default_cooldown_seconds)."""
        duration = duration_seconds if duration_seconds is not None else self._default_cooldown
        async with self._lock:
            expiry = time.monotonic() + duration
            self._cooldowns[key] = expiry
            log.info(
                "key_pool.key_cooldown_marked",
                key_prefix=f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else "...",
                duration_s=duration,
                active_cooldowns=len(self._cooldowns),
                total_keys=len(self._keys),
            )
