"""Thin AsyncGroq wrapper.

We isolate Groq behind this so the RAG service can be tested with a
FakeGroqClient. Production constructor reads the API key from settings.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from groq import AsyncGroq

from app.core.logging import get_logger

log = get_logger(__name__)


class GroqClient:
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = AsyncGroq(api_key=api_key)
        self._model = model

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
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

        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            stream=False,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        return resp.choices[0].message.content or ""
