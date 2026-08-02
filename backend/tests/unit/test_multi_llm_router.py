import pytest
from typing import AsyncIterator, Type, TypeVar
from pydantic import BaseModel

from app.services.llm.base import BaseLLMProvider
from app.services.llm.router import LLMRouter


class MockSchema(BaseModel):
    summary: str
    score: float


class FailingProvider(BaseLLMProvider):
    @property
    def provider_name(self) -> str:
        return "failing_primary"

    async def stream_completion(self, prompt: str, **kwargs) -> AsyncIterator[str]:
        raise RuntimeError("429 Rate limit exhausted on primary provider")
        yield ""

    async def complete(self, prompt: str, **kwargs) -> str:
        raise RuntimeError("429 Rate limit exhausted on primary provider")

    async def structured_complete(self, prompt: str, schema_class: Type[BaseModel], **kwargs):
        raise RuntimeError("429 Rate limit exhausted on primary provider")


class SuccessfulProvider(BaseLLMProvider):
    @property
    def provider_name(self) -> str:
        return "successful_fallback"

    async def stream_completion(self, prompt: str, **kwargs) -> AsyncIterator[str]:
        yield "Fallback "
        yield "response"

    async def complete(self, prompt: str, **kwargs) -> str:
        return "Fallback response text"

    async def structured_complete(self, prompt: str, schema_class: Type[BaseModel], **kwargs):
        return MockSchema(summary="Fallback summary", score=0.95)


@pytest.mark.asyncio
async def test_llm_router_failover_completion():
    primary = FailingProvider()
    fallback = SuccessfulProvider()
    router = LLMRouter(providers=[primary, fallback])

    result = await router.complete("Test prompt")
    assert result == "Fallback response text"


@pytest.mark.asyncio
async def test_llm_router_failover_streaming():
    primary = FailingProvider()
    fallback = SuccessfulProvider()
    router = LLMRouter(providers=[primary, fallback])

    tokens = []
    async for token in router.stream_completion("Test prompt"):
        tokens.append(token)

    assert "".join(tokens) == "Fallback response"


@pytest.mark.asyncio
async def test_llm_router_failover_structured():
    primary = FailingProvider()
    fallback = SuccessfulProvider()
    router = LLMRouter(providers=[primary, fallback])

    result = await router.structured_complete("Test prompt", MockSchema)
    assert isinstance(result, MockSchema)
    assert result.summary == "Fallback summary"
    assert result.score == 0.95
