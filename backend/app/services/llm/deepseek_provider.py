import json
import httpx
from typing import AsyncIterator, Type, TypeVar, Optional
from pydantic import BaseModel

from app.services.llm.base import BaseLLMProvider
from app.core.logging import get_logger

log = get_logger(__name__)
T = TypeVar("T", bound=BaseModel)

DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"


class DeepSeekProvider(BaseLLMProvider):
    """DeepSeek R1 / V3 reasoning provider (OpenAI-compatible REST interface)."""

    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        self._api_key = api_key
        self._model = model

    @property
    def provider_name(self) -> str:
        return "deepseek"

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{DEEPSEEK_BASE_URL}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        full_text = await self.complete(prompt, temperature=temperature, max_tokens=max_tokens)
        words = full_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")

    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        json_prompt = f"{prompt}\n\nReturn ONLY a JSON object matching schema: {schema_class.model_json_schema()}"
        res_text = await self.complete(json_prompt, temperature=temperature)
        clean_text = res_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        return schema_class.model_validate(data)
