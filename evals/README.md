# Polaris Eval Harness

> Quantifies retrieval + answer quality so RAG changes are data-driven instead of vibes-driven. See [ADR 0007](../docs/adr/0007-eval-methodology.md).

## What it measures

- **Retrieval** — `precision@k`, `recall@k`, `MRR` against a hand-labeled golden set.
- **Answer** — LLM-as-judge scores each generated answer on the question's `expected_answer_traits` (each trait → 0/1) + a single grounding score.

## Golden set

`datasets/golden.jsonl` — one example per line. Each entry:

```json
{
  "id": "stable-snake-case-id",
  "question": "What is the TCP three-way handshake?",
  "expected_passages": [
    {"document_filename_pattern": ".*networks.*\\.pdf", "page_numbers": [3, 4]}
  ],
  "expected_answer_traits": [
    "mentions SYN",
    "mentions SYN-ACK",
    "mentions ACK",
    "explains the purpose is to establish a TCP connection"
  ]
}
```

- `document_filename_pattern` — regex matched against `document_filename` returned by the retriever.
- `page_numbers` — list of integers. A retrieved chunk is considered a hit if its `(document_filename matches pattern) AND (page_number ∈ page_numbers)`.

The seed set ships with 3 placeholder entries to document the schema. Replace with real examples once you've uploaded a real corpus.

## How to run

Prereqs:
1. Local stack up (`just up`) with worker + api healthy.
2. A test user signed in at least once, with at least the documents covered by the golden set uploaded and `INDEXED`.
3. Either:
   - A Firebase **custom token** for that user (set `POLARIS_EVAL_BEARER`), or
   - A long-lived ID token captured from the frontend in DevTools.

```bash
# Local:
POLARIS_EVAL_BEARER="<your-firebase-id-token>" \
GROQ_API_KEY="<...>" \
just eval

# Reports land in evals/reports/<timestamp>.md
```

## CI

`.github/workflows/eval.yml` runs on **manual dispatch only** for now (the free-tier CI runners can't reasonably index documents). When we have a hosted eval rig, that workflow flips to "on PR touching retrieval/prompts/rag".

## Schema, code, regression threshold

- All eval code in `runners/` is pure Python — no external test framework.
- Regression threshold lives in `runners/run_eval.py` (default: ±5% on `precision@5` and `overall_grounding_score`). See ADR 0007 for the rationale.
