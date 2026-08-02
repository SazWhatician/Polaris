from abc import ABC, abstractmethod
from typing import AsyncIterator, Type, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(ABC):
    """Abstract base provider for normalized multi-LLM execution."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name identifier of provider (e.g. 'groq', 'gemini', 'openai')."""
        pass

    @abstractmethod
    async def stream_completion(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        """Stream completion text tokens asynchronously."""
        pass

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """Return full completion string."""
        pass

    @abstractmethod
    async def structured_complete(
        self,
        prompt: str,
        schema_class: Type[T],
        *,
        temperature: float = 0.1,
    ) -> T:
        """Parse structured Pydantic model response."""
        pass
