# 0007. Eval methodology — golden set, LLM-as-judge, regression threshold

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
RAG is one of those systems where "it works on my prompt" is not evidence. Every change to retrieval (chunk size, top_k, embedding model) or generation (prompt, temperature, model) can silently regress answer quality. Without a measurement loop, the only signal is user complaints — too late.

Phase 3 ships the MVP. From here on, every retrieval/prompt change must be data-justifiable.

## Decision
Build an eval harness with three pieces:

1. **Golden set** (`evals/datasets/golden.jsonl`) — hand-curated `(question, expected_passages, expected_answer_traits)` triples. Expected passages use regex on `document_filename_pattern` + a set of `page_numbers` to be tolerant of upload renames. Expected answer traits are short natural-language assertions a good answer should satisfy.

2. **Retrieval metrics** — `precision@k`, `recall@k`, `MRR`. Pure functions in `evals/runners/metrics.py`; no LLM dependency. A "hit" is a retrieved chunk whose `(document_filename matches pattern) AND (page_number ∈ expected pages)`.

3. **Answer eval** — LLM-as-judge using a separate Groq model (configurable via `GROQ_JUDGE_MODEL`). For each (Q, answer) pair it returns: per-trait 0/1 satisfaction + a single 0..1 grounding score (does the answer use `[#N]` citation markers consistent with the cited context). Output is parsed as JSON; the prompt explicitly forbids prose around the JSON.

**Regression gate** — a PR-touching change to retrieval/prompts/rag must keep `precision@5` and `overall_grounding_score` within **5%** of the last main-branch baseline. The 5% bound is what I'm willing to call "noise" on a 30-question golden set; will tighten as the dataset grows.

## Alternatives Considered
- **No evals; ship-and-pray.** Cheapest. Defaults to vibes-driven iteration. Doesn't pass an interview-defensibility bar.
- **Human-graded only.** Best quality, doesn't scale. Worth doing periodically to *audit* the LLM judge but not as the CI gate.
- **Ragas** (LangChain's eval toolkit). Has overlapping ideas (faithfulness, answer relevancy). Pros: prebuilt. Cons: opinionated, hides what's happening, drags in LangChain. We deliberately wrote ours — it's ~200 lines and it teaches the methodology. We can adopt Ragas later if specific metrics there are worth importing.
- **Reranker-style eval** (Cohere rerank as judge). Different bias profile. Worth A/B'ing in Phase 4+ if Groq's judging is suspect.

## Consequences
**Positive**
- Every retrieval/prompt change comes with a `evals/reports/<date>.md` file that quantifies the delta.
- The golden set doubles as living documentation of what Polaris is supposed to know about a user's corpus.
- The harness runs in <30 s for ~30 questions — fast enough to gate PRs.
- Test fixtures (`tests/unit/test_rag_service.py`) prove that retrieval-side wiring is correct; the eval proves it's *useful*. Two different walls.

**Negative / tradeoffs accepted**
- **LLM-as-judge bias is real.** Captured in `evals/runners/judge.py` docstring: length bias and self-preference. Mitigations: explicit per-trait scoring (not "is this good?"), and ability to swap the judge model.
- **Golden set is the bottleneck.** With 3 placeholder entries, the eval is mostly a smoke test. Real value kicks in once you've hand-curated ~30+ entries from your actual notes.
- **Free-tier Groq rate limits** — the eval runs sequentially with one judge call per item. ~30 items = ~30 judge calls = well within free quota but slow (~2 min).
- **CI runs on `workflow_dispatch` only** in Phase 3 — true CI eval-on-PR requires a hosted corpus the runner can index. Deferred until Phase 5/6.

**Revisit triggers**
- Golden set grows past ~100 — tighten regression threshold below 5%.
- We add reranking in retrieval — split into `precision@k` before/after reranker.
- We add a second LLM (Claude/GPT) for judging — break the LLM-as-judge self-preference.
