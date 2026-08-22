import json
import re
from typing import AsyncIterator, Type, TypeVar
from pydantic import BaseModel

from app.services.llm.base import BaseLLMProvider
from app.services.groq_client import GroqClient

T = TypeVar("T", bound=BaseModel)


class GroqProvider(BaseLLMProvider):
    """Groq ultra low-latency Llama-3 provider wrapper."""

    def __init__(self, groq_client: GroqClient):
        self._groq = groq_client

    @property
    def provider_name(self) -> str:
        return "groq"

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        async for token in self._groq.stream_completion(
            prompt, temperature=temperature, max_tokens=max_tokens
        ):
            yield token

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        full_text = []
        async for token in self._groq.stream_completion(
            prompt, temperature=temperature, max_tokens=max_tokens
        ):
            full_text.append(token)
        return "".join(full_text)

    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        json_prompt = (
            f"{prompt}\n\n"
            f"IMPORTANT: Respond with ONLY a valid JSON object matching this schema. No markdown formatting, no thinking tags.\n"
            f"Schema: {schema_class.model_json_schema()}"
        )
        response_text = await self.complete(json_prompt, temperature=temperature, max_tokens=2048)
        
        # Clean think tags and extract JSON substring
        cleaned = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
        match = re.search(r"\{[\s\S]*\}", cleaned)
        json_str = match.group(0) if match else cleaned.replace("```json", "").replace("```", "").strip()
        data = json.loads(json_str)
        return schema_class.model_validate(data)


GroqLLMProvider = GroqProvider

