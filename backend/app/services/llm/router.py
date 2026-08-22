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


def create_default_llm_router(
    groq_api_key: Optional[str] = None,
    nvidia_api_key: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    task: str = "chat",
) -> LLMRouter:
    """Builds task-specialized LLMRouter distributing load across NVIDIA DeepSeek, Groq, and Gemini with key rotation."""
    from app.core.config import get_settings
    from app.services.groq_client import GroqClient
    from app.services.gemini_client import GeminiClient
    from app.services.llm.nvidia_provider import NvidiaLLMProvider
    from app.services.llm.groq_provider import GroqLLMProvider
    from app.services.llm.gemini_provider import GeminiLLMProvider

    settings = get_settings()

    # Determine key lists: explicit args take precedence over settings
    groq_keys = [groq_api_key] if groq_api_key else settings.parsed_groq_api_keys
    nvidia_keys = [nvidia_api_key] if nvidia_api_key else settings.parsed_nvidia_nim_api_keys
    gemini_keys = [gemini_api_key] if gemini_api_key else settings.parsed_gemini_api_keys

    nv_provider = (
        NvidiaLLMProvider(api_keys=nvidia_keys, model=settings.nvidia_nim_model)
        if nvidia_keys
        else None
    )
    gq_provider = (
        GroqLLMProvider(
            groq_client=GroqClient(api_keys=groq_keys, model=settings.groq_model)
        )
        if groq_keys
        else None
    )
    gm_provider = (
        GeminiLLMProvider(
            gemini_client=GeminiClient(api_keys=gemini_keys, model=settings.gemini_model)
        )
        if gemini_keys
        else None
    )

    providers = []

    if task == "chat":
        # Chat -> Groq (ultra fast) -> Gemini -> NVIDIA
        for p in (gq_provider, gm_provider, nv_provider):
            if p:
                providers.append(p)

    elif task in ("graph", "gap"):
        # Graph & Gap Extraction -> Groq (Fast JSON) -> Gemini -> NVIDIA
        for p in (gq_provider, gm_provider, nv_provider):
            if p:
                providers.append(p)

    elif task == "syllabus":
        # Syllabus Parsing -> Gemini (1M Token Context) -> Groq -> NVIDIA
        for p in (gm_provider, gq_provider, nv_provider):
            if p:
                providers.append(p)

    else:
        # Fallback default order
        for p in (gq_provider, gm_provider, nv_provider):
            if p:
                providers.append(p)

    if not providers:
        dummy_groq = GroqClient(api_key="dummy_key", model="qwen/qwen3.6-27b")
        providers.append(GroqLLMProvider(groq_client=dummy_groq))

    return LLMRouter(providers)



