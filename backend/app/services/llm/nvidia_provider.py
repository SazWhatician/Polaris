import json
import httpx
from typing import AsyncIterator, Type, TypeVar, Optional, List
from pydantic import BaseModel

from app.services.llm.base import BaseLLMProvider
from app.services.key_pool import KeyPool
from app.core.logging import get_logger

log = get_logger(__name__)
T = TypeVar("T", bound=BaseModel)

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"


class NvidiaLLMProvider(BaseLLMProvider):
    """NVIDIA NIM provider supporting DeepSeek-v4-pro, DeepSeek-R1, and Llama-3.1 models with key rotation."""

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        api_keys: Optional[List[str]] = None,
        key_pool: Optional[KeyPool] = None,
        model: str = "deepseek-ai/deepseek-v4-pro",
    ):
        self._model = model
        if key_pool:
            self._key_pool = key_pool
        elif api_keys:
            self._key_pool = KeyPool(api_keys)
        elif api_key:
            self._key_pool = KeyPool([api_key])
        else:
            raise ValueError("NvidiaLLMProvider requires api_key, api_keys, or key_pool")

    @property
    def provider_name(self) -> str:
        return f"nvidia:{self._model}"

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "chat_template_kwargs": {"thinking": False},
        }

        attempts = 0
        max_attempts = self._key_pool.total_keys

        async with httpx.AsyncClient(timeout=60.0) as client:
            while attempts < max_attempts:
                attempts += 1
                key = await self._key_pool.get_next_key()
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                }
                try:
                    resp = await client.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 429:
                        log.warning("nvidia.rate_limit_exceeded", attempt=attempts)
                        await self._key_pool.mark_cooldown(key)
                        if attempts >= max_attempts:
                            resp.raise_for_status()
                        continue

                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code == 429:
                        await self._key_pool.mark_cooldown(key)
                    if attempts >= max_attempts:
                        raise

        return ""

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "chat_template_kwargs": {"thinking": False},
        }


        attempts = 0
        max_attempts = self._key_pool.total_keys

        async with httpx.AsyncClient(timeout=60.0) as client:
            while attempts < max_attempts:
                attempts += 1
                key = await self._key_pool.get_next_key()
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                }
                try:
                    async with client.stream("POST", f"{NVIDIA_BASE_URL}/chat/completions", headers=headers, json=payload) as resp:
                        if resp.status_code == 429:
                            log.warning("nvidia.rate_limit_exceeded_stream", attempt=attempts)
                            await self._key_pool.mark_cooldown(key)
                            if attempts >= max_attempts:
                                resp.raise_for_status()
                            continue

                        resp.raise_for_status()
                        async for line in resp.aiter_lines():
                            if not line or not line.startswith("data: "):
                                continue
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                delta = chunk["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield delta
                            except Exception:
                                continue
                        return
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code == 429:
                        await self._key_pool.mark_cooldown(key)
                    if attempts >= max_attempts:
                        raise

    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        json_prompt = f"{prompt}\n\nReturn ONLY a valid JSON object matching this JSON schema:\n{schema_class.model_json_schema()}"
        res_text = await self.complete(json_prompt, temperature=temperature)
        clean_text = res_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        return schema_class.model_validate(data)

