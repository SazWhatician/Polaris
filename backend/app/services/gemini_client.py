"""Thin Gemini client wrapper supporting multi-key rotation and 429 rate-limit failover using httpx."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from app.core.logging import get_logger
from app.services.key_pool import KeyPool

log = get_logger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiRateLimitError(Exception):
    """Raised when Gemini API returns 429 Resource Exhausted."""


class GeminiClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        api_keys: list[str] | None = None,
        key_pool: KeyPool | None = None,
        model: str = "gemini-1.5-flash",
    ) -> None:
        self._model = model
        if key_pool:
            self._key_pool = key_pool
        elif api_keys:
            self._key_pool = KeyPool(api_keys)
        elif api_key:
            self._key_pool = KeyPool([api_key])
        else:
            raise ValueError("GeminiClient requires api_key, api_keys, or key_pool")

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        attempts = 0
        max_attempts = self._key_pool.total_keys

        payload: dict[str, list[dict[str, list[dict[str, str]]]] | dict[str, float | int | str]] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"  # type: ignore[index]

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            while attempts < max_attempts:
                attempts += 1
                key = await self._key_pool.get_next_key()
                url = f"{GEMINI_BASE_URL}/{self._model}:generateContent?key={key}"

                try:
                    res = await http_client.post(url, json=payload)
                    if res.status_code == 429:
                        log.warning("gemini.rate_limit_exceeded", attempt=attempts, status=429)
                        await self._key_pool.mark_cooldown(key)
                        if attempts >= max_attempts:
                            raise GeminiRateLimitError(
                                "Gemini API rate limit exceeded on all keys."
                            )
                        continue

                    res.raise_for_status()
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                    return ""
                except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                        await self._key_pool.mark_cooldown(key)
                        if attempts >= max_attempts:
                            raise GeminiRateLimitError("Gemini rate limit exceeded.") from exc
                    else:
                        raise

        return ""

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        attempts = 0
        max_attempts = self._key_pool.total_keys

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            while attempts < max_attempts:
                attempts += 1
                key = await self._key_pool.get_next_key()
                url = f"{GEMINI_BASE_URL}/{self._model}:streamGenerateContent?alt=sse&key={key}"

                try:
                    async with http_client.stream("POST", url, json=payload) as res:
                        if res.status_code == 429:
                            log.warning("gemini.rate_limit_exceeded_stream", attempt=attempts)
                            await self._key_pool.mark_cooldown(key)
                            if attempts >= max_attempts:
                                raise GeminiRateLimitError(
                                    "Gemini rate limit exceeded on streaming."
                                )
                            continue

                        res.raise_for_status()
                        async for line in res.aiter_lines():
                            if line.startswith("data: "):
                                json_str = line[6:].strip()
                                if json_str == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(json_str)
                                    candidates = chunk.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        if parts and "text" in parts[0]:
                                            yield parts[0]["text"]
                                except json.JSONDecodeError:
                                    continue
                        return
                except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                    if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                        await self._key_pool.mark_cooldown(key)
                        if attempts >= max_attempts:
                            raise GeminiRateLimitError("Gemini rate limit exceeded.") from exc
                    else:
                        raise
