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


def test_create_default_llm_router_task_specialization():
    from app.services.llm.router import create_default_llm_router

    chat_router = create_default_llm_router(
        groq_api_key="g1,g2",
        nvidia_api_key="n1",
        gemini_api_key="m1",
        task="chat",
    )
    names = [p.provider_name for p in chat_router.providers]
    assert names[0].startswith("nvidia")
    assert names[1] == "groq"
    assert names[2] == "gemini"

    graph_router = create_default_llm_router(
        groq_api_key="g1",
        nvidia_api_key="n1",
        gemini_api_key="m1",
        task="graph",
    )
    graph_names = [p.provider_name for p in graph_router.providers]
    assert graph_names[0] == "groq"
    assert graph_names[1].startswith("nvidia")
    assert graph_names[2] == "gemini"

    syllabus_router = create_default_llm_router(
        groq_api_key="g1",
        nvidia_api_key="n1",
        gemini_api_key="m1",
        task="syllabus",
    )
    syl_names = [p.provider_name for p in syllabus_router.providers]
    assert syl_names[0] == "gemini"
    assert syl_names[1] == "groq"
    assert syl_names[2].startswith("nvidia")

