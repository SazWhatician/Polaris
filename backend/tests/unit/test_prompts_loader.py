import pytest
from app.services import prompts


def test_loads_rag_answer_v1_real_prompt() -> None:
    """Smoke test against the real prompt shipped in app/prompts/."""
    text = prompts.load("rag_answer", "v1")
    assert "{context}" in text
    assert "{question}" in text
    assert "Polaris" in text
    formatted = text.format(context="test_ctx", question="test_q")
    assert "test_ctx" in formatted
    assert "test_q" in formatted


def test_missing_prompt_raises() -> None:
    prompts.clear_cache()
    with pytest.raises(prompts.PromptNotFoundError):
        prompts.load("nonexistent", "v1")


def test_load_is_cached() -> None:
    prompts.clear_cache()
    a = prompts.load("rag_answer", "v1")
    b = prompts.load("rag_answer", "v1")
    assert a is b  # same object — proves the cache hit


def test_clear_cache_forces_reread() -> None:
    a = prompts.load("rag_answer", "v1")
    prompts.clear_cache()
    b = prompts.load("rag_answer", "v1")
    assert a == b
    assert a is not b  # different objects after reload
