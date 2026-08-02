import json
from typing import AsyncIterator, Type, TypeVar, Optional
from pydantic import BaseModel

from app.services.llm.base import BaseLLMProvider
from app.services.gemini_client import GeminiClient

T = TypeVar("T", bound=BaseModel)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini Flash/Pro provider wrapper."""

    def __init__(self, gemini_client: GeminiClient):
        self._gemini = gemini_client

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        # Complete full response and yield in tokens if streaming endpoint un-wrapped
        res_text = await self._gemini.complete(prompt, temperature=temperature, max_tokens=max_tokens)
        words = res_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        return await self._gemini.complete(prompt, temperature=temperature, max_tokens=max_tokens)

    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        json_prompt = f"{prompt}\n\nReturn JSON matching schema: {schema_class.model_json_schema()}"
        res_text = await self._gemini.complete(
            json_prompt, temperature=temperature, json_mode=True
        )
        clean_text = res_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        return schema_class.model_validate(data)
