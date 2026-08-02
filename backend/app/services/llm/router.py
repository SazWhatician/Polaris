from typing import AsyncIterator, List, Type, TypeVar, Optional
from pydantic import BaseModel
from app.services.llm.base import BaseLLMProvider
from app.core.logging import get_logger

log = get_logger(__name__)
T = TypeVar("T", bound=BaseModel)


class LLMRouter:
    """Multi-LLM provider router supporting ordered fallback chain execution."""

    def __init__(self, providers: List[BaseLLMProvider]):
        if not providers:
            raise ValueError("LLMRouter requires at least one BaseLLMProvider instance")
        self._providers = providers

    @property
    def providers(self) -> List[BaseLLMProvider]:
        return self._providers

    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        """Try providers in fallback chain order until streaming completion succeeds."""
        last_exception: Optional[Exception] = None

        for provider in self._providers:
            try:
                log.info("llm.router.attempt", provider=provider.provider_name)
                async for token in provider.stream_completion(
                    prompt, temperature=temperature, max_tokens=max_tokens
                ):
                    yield token
                return  # Stream completed cleanly
            except Exception as exc:
                log.warning(
                    "llm.router.failover",
                    provider=provider.provider_name,
                    error=str(exc),
                )
                last_exception = exc

        if last_exception:
            raise last_exception

    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """Try providers in fallback chain order until completion succeeds."""
        last_exception: Optional[Exception] = None

        for provider in self._providers:
            try:
                log.info("llm.router.attempt", provider=provider.provider_name)
                return await provider.complete(
                    prompt, temperature=temperature, max_tokens=max_tokens
                )
            except Exception as exc:
                log.warning(
                    "llm.router.failover",
                    provider=provider.provider_name,
                    error=str(exc),
                )
                last_exception = exc

        raise last_exception or RuntimeError("All LLM providers in fallback chain failed")

    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        """Try providers in fallback chain order until structured completion succeeds."""
        last_exception: Optional[Exception] = None

        for provider in self._providers:
            try:
                log.info("llm.router.attempt_structured", provider=provider.provider_name)
                return await provider.structured_complete(
                    prompt, schema_class, temperature=temperature
                )
            except Exception as exc:
                log.warning(
                    "llm.router.failover_structured",
                    provider=provider.provider_name,
                    error=str(exc),
                )
                last_exception = exc

        raise last_exception or RuntimeError("All LLM providers in structured fallback chain failed")
