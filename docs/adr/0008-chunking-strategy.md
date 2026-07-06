# 0008. Chunking strategy: RecursiveCharacterTextSplitter at 800/100

- **Status:** Accepted (provisional — re-evaluate at Phase 4 with eval data)
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
For RAG, the chunking step is the silent killer of answer quality. Three knobs:

1. **Splitter strategy** — fixed-window vs sentence-aware vs hierarchical.
2. **Chunk size** — too small = no context per chunk; too large = noisy retrieval + token waste.
3. **Overlap** — protects against splitting mid-sentence at chunk boundaries.

The corpus is OCR'd academic notes. Pages are short (~500–1500 chars typical for handwritten notes; longer for textbook PDFs). The retrieved chunks feed into a 8 KB-of-context prompt to Groq.

## Decision
Use **LangChain's `RecursiveCharacterTextSplitter`** with:

- `chunk_size = 800` characters
- `chunk_overlap = 100` characters
- `separators = ["\n\n", "\n", ". ", " ", ""]` (default plus explicit `". "`)

Re-evaluate after Phase 3 ships and we have eval baseline numbers (ADR 0007).

## Alternatives Considered
- **Fixed-window byte slicing** — simplest. Cuts mid-word and mid-sentence. Hurts answer quality measurably.
- **Sentence-aware via spaCy** — quality good. Pulls in spaCy as a base dep (50+ MB) and a per-language model. Defer until we ship Phase 8 (which uses spaCy anyway for NER).
- **Semantic chunking** (embed sliding window + cluster) — interesting, but ~3× the embedding cost at ingest. Worth A/B in Phase 4 if eval numbers stall.
- **Hierarchical / parent-document retrieval** — retrieve small chunks, return larger parent for context. Probably the right end-state. Defer until we measure that "small chunks lose context" is the failure mode.
- **Different sizes** — 400/50 (more chunks, finer retrieval, more noise), 1500/150 (fewer chunks, broader context, sparser retrieval). 800/100 is the conventional "RAG default" for academic text; we start there and tune.

## Consequences
**Positive**
- LangChain's recursive splitter respects paragraph → sentence → word boundaries before falling back to character split. Empirically the best 80/20 for general text.
- The `(800, 100)` numbers are easy to remember and to compare against benchmarks ("Chroma's default is 1000/200, ours is 800/100 because our pages are shorter").
- Eval harness (ADR 0007) will tell us whether to move.

**Negative / tradeoffs accepted**
- Provisional choice with no eval data behind it yet — explicitly marked Provisional in status. Action item: re-run eval at the start of Phase 4 with chunk size sweeps {400, 600, 800, 1200} and pick the best.
- Page-boundary awareness is implicit only (we chunk per page) — chunks never span pages. Pro: citations are clean. Con: a sentence split across pages gets fragmented. Acceptable tradeoff for citation cleanliness.
- LangChain dep — we use `langchain-text-splitters` only (not full `langchain`), so the surface is tiny and the upgrade pain is low.

**Revisit triggers**
- Phase 4 eval data — likely to change to (600, 50) or (1000, 150) based on numbers.
- Switching embedding model (NV-Embed in Phase 9) may want larger chunks since the model has more context capacity.
- Frequent "answer is wrong because key fact was split" failure mode → bump overlap.
