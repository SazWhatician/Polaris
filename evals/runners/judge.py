"""LLM-as-judge scorer.

Given (question, answer, expected_traits), asks the judge model (a separate,
preferably-larger Groq model) to return a JSON object scoring each trait 0/1
plus a single 0..1 grounding score with one sentence of reasoning.

Known biases of LLM-as-judge — captured in ADR 0007:
  * Length bias (longer answers score higher) — mitigated by asking explicitly
    for trait *satisfaction*, not "is this a good answer".
  * Self-preference if the judge and the answerer are the same model — we use
    the same Groq endpoint but you can swap GROQ_JUDGE_MODEL to a different
    weight class for less correlated judgments.
"""
from __future__ import annotations

import json
from collections.abc import Awaitable, Callable

from evals.runners.schema import AnswerMetrics, GoldenItem, TraitScore

_JUDGE_PROMPT = """You are an impartial grader of student-assistant answers.

Question:
{question}

Answer to grade:
{answer}

Expected traits (one per line — judge whether each is satisfied):
{traits}

Score independently:
1. For each trait, return 1 if the answer satisfies it, 0 otherwise.
2. Return a separate `grounding_score` between 0.0 and 1.0 reflecting whether the answer's claims are supported by citations in the answer text (mentions of `[#N]` markers indicate citations).

Return ONLY a JSON object with this shape (no prose, no code fences):
{{
  "trait_scores": [
    {{"trait": "<trait text>", "score": 0 or 1}}
  ],
  "grounding_score": <float 0..1>,
  "reasoning": "<one short sentence>"
}}
"""


async def judge(
    *,
    item: GoldenItem,
    answer: str,
    groq_complete: Callable[[str], Awaitable[str]],
) -> AnswerMetrics:
    """`groq_complete` is an async (str) -> str coroutine — typically
    GroqClient.complete bound to the judge model."""
    traits_block = "\n".join(f"- {t}" for t in item.expected_answer_traits)
    prompt = _JUDGE_PROMPT.format(
        question=item.question, answer=answer, traits=traits_block,
    )
    raw = await groq_complete(prompt)
    parsed = _safe_parse_json(raw)

    trait_scores = [
        TraitScore(trait=str(t.get("trait", "")), score=float(t.get("score", 0)))
        for t in parsed.get("trait_scores", [])
    ]
    return AnswerMetrics(
        grounding_score=float(parsed.get("grounding_score", 0.0)),
        trait_scores=trait_scores,
        judge_reasoning=str(parsed.get("reasoning", "")),
    )


def _safe_parse_json(raw: str) -> dict:
    """Be forgiving: the judge sometimes wraps JSON in ```json``` fences."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json\n"):
            raw = raw[5:]
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Last-ditch: find the first { and the last }.
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(raw[start : end + 1])
            except json.JSONDecodeError:
                pass
    return {"trait_scores": [], "grounding_score": 0.0, "reasoning": "judge output unparseable"}
