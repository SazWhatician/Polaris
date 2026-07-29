"""Thin AsyncGroq wrapper supporting multi-key rotation and 429 rate-limit failover.

We isolate Groq behind this so the RAG service can be tested with a
FakeGroqClient. Production constructor reads API key(s) from settings.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from groq import AsyncGroq, RateLimitError

from app.core.logging import get_logger
from app.services.key_pool import KeyPool

log = get_logger(__name__)


class GroqClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        api_keys: list[str] | None = None,
        key_pool: KeyPool | None = None,
        model: str,
    ) -> None:
        self._model = model
        if key_pool:
            self._key_pool = key_pool
        elif api_keys:
            self._key_pool = KeyPool(api_keys)
        elif api_key:
            self._key_pool = KeyPool([api_key])
        else:
            raise ValueError("GroqClient requires api_key, api_keys, or key_pool")

        self._clients: dict[str, AsyncGroq] = {}

    def _get_client_for_key(self, key: str) -> AsyncGroq:
        if key not in self._clients:
            self._clients[key] = AsyncGroq(api_key=key)
        return self._clients[key]

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        attempts = 0
        max_attempts = self._key_pool.total_keys

        while attempts < max_attempts:
            attempts += 1
            key = await self._key_pool.get_next_key()
            client = self._get_client_for_key(key)
            try:
                stream = await client.chat.completions.create(
                    model=self._model,
                    messages=[{"role": "user", "content": prompt}],
                    stream=True,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                async for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
                return
            except RateLimitError as exc:
                log.warning("groq.rate_limit_exceeded", attempt=attempts, error=str(exc))
                await self._key_pool.mark_cooldown(key)
                if attempts >= max_attempts:
                    raise

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.0,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> str:
        """Non-streaming; used by the eval harness (LLM-as-judge) and structured JSON tasks."""
        kwargs = {}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        attempts = 0
        max_attempts = self._key_pool.total_keys

        while attempts < max_attempts:
            attempts += 1
            key = await self._key_pool.get_next_key()
            client = self._get_client_for_key(key)
            try:
                resp = await client.chat.completions.create(
                    model=self._model,
                    messages=[{"role": "user", "content": prompt}],
                    stream=False,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs,
                )
                return resp.choices[0].message.content or ""
            except RateLimitError as exc:
                log.warning("groq.rate_limit_exceeded", attempt=attempts, error=str(exc))
                await self._key_pool.mark_cooldown(key)
                if attempts >= max_attempts:
                    raise
        return ""
