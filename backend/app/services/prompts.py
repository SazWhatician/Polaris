"""Versioned markdown prompt loader.

Prompts live under app/prompts/{name}/{version}.md.
Once loaded, they're cached in memory for the process lifetime.
Callers fill placeholders with `str.format(...)` — keeps it simple.
"""

from __future__ import annotations

from pathlib import Path

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
_cache: dict[tuple[str, str], str] = {}


class PromptNotFoundError(FileNotFoundError):
    pass


def load(name: str, version: str = "v1") -> str:
    key = (name, version)
    cached = _cache.get(key)
    if cached is not None:
        return cached

    path = _PROMPTS_DIR / name / f"{version}.md"
    if not path.is_file():
        raise PromptNotFoundError(f"Prompt not found: {path}")
    text = path.read_text(encoding="utf-8")
    _cache[key] = text
    return text


def clear_cache() -> None:
    """For tests that mutate prompt files."""
    _cache.clear()
