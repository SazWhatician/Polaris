# Phase 3 — Vector Search + RAG Chat + Eval Harness — **MVP**

> **Outcome:** End-to-end RAG. Upload → OCR → chunk → embed → Qdrant → ask a question on `/chat` → see a streamed grounded answer with clickable page-level citations. An eval harness scores retrieval (`precision@k`, `recall@k`, MRR) and answer quality (LLM-as-judge) against a golden set; it ships with a manual-dispatch CI workflow and a `just eval` local target.
>
> **This is the MVP** — the demo you put in the README and explain in an interview.

---

## Files created / modified (grouped)

### Backend — RAG stack
| Path | Purpose |
|---|---|
| `app/models/rag.py` | `Chunk`, `RetrievedChunk`, `ChatMessage`, `ChatRequest`, `Citation` schemas |
| `app/services/chunking_service.py` | LangChain `RecursiveCharacterTextSplitter` wrapper; preserves `page_number` on every chunk; skips empty pages |
| `app/services/embedding_service.py` | sentence-transformers singleton (`all-MiniLM-L6-v2`, 384-dim, normalized); batched; `warm_up()` to load at startup |
| `app/repositories/qdrant_repo.py` | `AsyncQdrantClient` wrapper; **every search includes `user_id` filter — non-negotiable**; deterministic point IDs from `uuid5(NAMESPACE_URL, "polaris/{uid}/{doc}/{page}/{chunk}")` so re-runs replace cleanly |
| `app/services/ingest_service.py` | Orchestrates chunk → embed → delete-then-upsert; transitions `OCR_COMPLETE → INDEXING → INDEXED \| FAILED` |
| `app/services/groq_client.py` | `AsyncGroq` wrapper with `stream_completion()` + `complete()` (latter used by eval judge) |
| `app/services/rag_service.py` | embed question → search Qdrant (user-scoped) → format `[#N]`-numbered context → load versioned prompt → stream Groq tokens; yields heterogeneous events (citations, token×N, done) |
| `app/services/prompts.py` | Markdown prompt loader; caches by `(name, version)` |
| `app/prompts/rag_answer/v1.md` | First versioned prompt — explicit grounding rules + citation conventions |
| `app/api/chat.py` | `POST /api/chat/stream` using `sse_starlette.EventSourceResponse`; detects client disconnect mid-stream |

### Backend — wiring
| Path | Purpose |
|---|---|
| `app/core/config.py` (modified) | `qdrant_url`, `qdrant_api_key`, `embedding_model`, `embedding_dim`, `embedding_batch_size`, `chunk_size`, `chunk_overlap`, `groq_api_key`, `groq_model`, `groq_judge_model`, `rag_top_k`, `rag_max_context_chars`, `qdrant_collection_name` property (per-env) |
| `app/models/document.py` (modified) | New states `INDEXING`, `INDEXED` |
| `app/services/status_transition.py` (modified) | Updated `VALID_TRANSITIONS` with the new states; existing `OCR_COMPLETE → QUEUED` (re-OCR) preserved |
| `app/services/document_service.py` (modified) | Accepts optional `qdrant_repo`; `delete_document` also tears down Qdrant points for the doc |
| `app/api/documents.py` (modified) | Passes `qdrant_repo` from `app.state` into the service |
| `app/main.py` (modified) | Lifespan builds Qdrant client + ensures collection + warms embedding singleton + builds Groq client + attaches `RagService` to `app.state.rag_service`; cleanly closes the client on shutdown |
| `app/workers/ocr_worker.py` (modified) | Adds `ingest_document` arq task; `ocr_document` enqueues `ingest_document` on success; `_startup` builds the ingest stack |

### Backend — tests (24 new)
| Path | Count |
|---|---|
| `tests/unit/test_status_transition.py` (extended) | +5 (new states + INDEXED→QUEUED) |
| `tests/unit/test_chunking_service.py` | 4 |
| `tests/unit/test_prompts_loader.py` | 4 |
| `tests/unit/test_qdrant_repo.py` | 6 (user_id-filter invariant covered explicitly) |
| `tests/unit/test_rag_service.py` | 4 (happy path, empty retrieval fallback, doc-scoping, context truncation) |

### Infra
| Path | Purpose |
|---|---|
| `backend/requirements.txt` (modified) | `langchain-text-splitters`, `sentence-transformers`, `qdrant-client`, `groq`, `sse-starlette` |
| `backend/Dockerfile` (modified) | Bakes embedding model in API image (so chat startup is fast) |
| `backend/Dockerfile.worker` (modified) | Bakes embedding model in worker image too (for ingest) |
| `backend/.env{.example}` (modified) | `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, optional `LANGCHAIN_TRACING_V2` |

### Frontend
| Path | Purpose |
|---|---|
| `lib/api/chat.ts` | fetch-based SSE consumer (EventSource can't send Bearer token); manual `\n\n`-frame parsing; `AbortSignal` support |
| `components/chat-message.tsx` | Bubble UI; streaming cursor; **clickable citation chips** that open a Dialog with full chunk text + similarity score |
| `app/chat/page.tsx` | Chat page: messages list (auto-scroll), textarea (Enter to send, Shift-Enter newline), Send/Stop button, optimistic placeholder for streaming assistant message |
| `components/site-header.tsx` (modified) | Adds `/dashboard` and `/chat` nav links with active styling |

### Eval harness
| Path | Purpose |
|---|---|
| `evals/README.md` | Schema + run instructions |
| `evals/datasets/golden.jsonl` | 3 seed entries documenting the schema (placeholders — fill in once you have a corpus) |
| `evals/runners/schema.py` | `GoldenItem`, `ExpectedPassage`, `RetrievedHit`, `RetrievalMetrics`, `AnswerMetrics`, `ItemResult` |
| `evals/runners/metrics.py` | Pure `precision@k`, `recall@k`, `MRR`; regex hit-matching |
| `evals/runners/judge.py` | LLM-as-judge prompt + JSON parser tolerant of code-fence wrapping; documented bias mitigations |
| `evals/runners/report.py` | Markdown aggregator: per-item + overall tables + details |
| `evals/runners/run_eval.py` | Orchestrates: load golden → call `/api/chat/stream` → parse SSE → score retrieval → judge answer → write `evals/reports/<ts>.md` |
| `Justfile` (modified) | `just eval` |
| `.github/workflows/eval.yml` | `workflow_dispatch` only for now — needs secrets `POLARIS_EVAL_API_BASE`, `POLARIS_EVAL_BEARER`, `GROQ_API_KEY` |

### Docs
| Path | Purpose |
|---|---|
| `adr/0007-eval-methodology.md` | Golden-set construction · LLM-as-judge bias · 5% regression threshold |
| `adr/0008-chunking-strategy.md` | 800/100 chosen + Provisional · re-evaluation triggers · sweep plan |
| `architecture.md` (modified) | Phase 3 MVP diagram (Qdrant + Groq edges added) |
| `phase-summaries/phase-3.md` | This document |

---

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/chat/stream` | Bearer | SSE — `citations` event first, then many `token` events, then `done` |

---

## State machine (updated)

```
REQUESTED → UPLOADED → QUEUED → PROCESSING → OCR_COMPLETE → INDEXING → INDEXED
                                       ↘ FAILED        ↘ FAILED      ↘ FAILED
                              ↘ FAILED
   INDEXED → QUEUED (full reprocess)
   OCR_COMPLETE → QUEUED (re-OCR)
   FAILED → QUEUED (retry)
```

User-visible terminal state is now **INDEXED**, meaning the doc is searchable + chat-ready.

---

## Concepts to internalize (interview-framed)

| Concept | Why it matters in an interview |
|---|---|
| RAG end-to-end | The dominant LLM app shape in 2026 — own how every stage works |
| Multi-tenant vector DB | "How do you ensure users can't see each other's data?" — payload filter + tested in `test_qdrant_repo.py` |
| Deterministic point IDs (uuid5) | Re-ingest = upsert that replaces cleanly. No need to "delete then insert" *between users*; only within (user, doc) |
| SSE with fetch (not EventSource) | Custom auth headers + POST body — common need; EventSource limitations are an interview trap |
| Cancellation propagation | `AbortController` on client; `request.is_disconnected()` on server — best-effort but you can defend it |
| Prompt versioning | When you change a prompt, you change behavior — every change should be diffable |
| Eval-driven retrieval changes | Defends every retrieval tuning decision with numbers; ADR 0007 walks through judge bias |
| LangChain text-splitters only | Bringing in subpackages, not the full LangChain — defensible to anyone who's been burned by LC's abstractions |
| Two-image Docker (API vs worker) | API stays lean; worker carries PaddleOCR + Paddle; both share base deps |
| `OCR_COMPLETE → INDEXING → INDEXED` split | Splits "what was extracted" from "what's searchable"; the user sees the right granularity |
| Idempotent ingest (delete-then-rewrite) | Crash-during-ingest is safe; running twice = same result |

---

## Gotchas (real ones — pre-empted in code where possible)

1. **`GROQ_API_KEY` blank → chat returns 503.** Lifespan logs `app.rag.unavailable` and leaves `app.state.rag_service = None`. Get a free key at `console.groq.com` and put it in `backend/.env`.
2. **Qdrant Cloud uses `api_key` + HTTPS URL.** For local self-hosted (the default), leave `QDRANT_API_KEY` blank.
3. **First chat request after `just up` takes a few extra seconds** because the embedding model loads. Mitigation: `embedder.warm_up()` is called in the lifespan, but Python lazy-loads sentence-transformers' underlying model on first encode. Document only.
4. **Building the worker image is now ~12-15 min cold** because we bake `paddleocr` *and* the embedding model. Subsequent builds use the Docker layer cache and are fast.
5. **EventSource can't carry an Authorization header.** That's why `lib/api/chat.ts` uses fetch + ReadableStream + manual SSE parsing. If you use a different streaming consumer, port it carefully.
6. **`asyncio.to_thread` + sentence-transformers + Windows quirks.** The encode runs on a worker thread to avoid blocking the loop. If you hit `RuntimeError: cannot schedule new futures after interpreter shutdown` on Windows during tests, ensure you're awaiting all `embed()` calls before the loop closes.
7. **Stale chunks after Reprocess.** Fixed: `ingest_service` deletes all points for `(user_id, document_id)` before reupserting. Without that, you'd accumulate vectors.
8. **The judge LLM sometimes wraps its JSON in ```json fences.** Handled in `evals/runners/judge.py:_safe_parse_json` — strip fences, then fall back to "first `{` to last `}`" parse.
9. **`document_filename_pattern` is a regex.** A literal filename works (e.g. `"networks-final.pdf"`), but if your file is `network's-final.pdf` (apostrophe), escape it or use `re.escape` upstream. Documented in `evals/README.md`.
10. **Eval needs a Firebase ID token.** Get one from DevTools after signing in (`await firebase.auth().currentUser.getIdToken()` in the console) and pass via `POLARIS_EVAL_BEARER`. Token expires in ~1 hour.

---

## What you do next (before saying "start phase 4")

### One-time setup
1. **Get a Groq API key** at `console.groq.com` (free tier). Put it in `backend/.env` as `GROQ_API_KEY=...`.
2. **Decide Qdrant**: stay on the docker-compose self-hosted (default; works out of the box) OR sign up for Qdrant Cloud free tier and set `QDRANT_URL` + `QDRANT_API_KEY`.

### Rebuild + run
3. `cd backend && pip install -r requirements.txt` — picks up langchain-text-splitters, sentence-transformers, qdrant-client, groq, sse-starlette.
4. `cd frontend && npm install` — no new deps.
5. `just up` — **API image rebuild bakes the embedding model** (~3 min). Worker image bakes both models (~12 min cold; ~30s warm).
6. `docker-compose logs -f api` — wait for `app.rag.ready`. If you see `app.rag.unavailable`, check `GROQ_API_KEY`.
7. `docker-compose logs -f worker` — wait for `worker.startup engine=paddleocr-2.7 embedding_model=sentence-transformers/all-MiniLM-L6-v2`.

### Exercise the MVP
8. Sign in → Dashboard → upload a PDF. Watch status flow: `queued → processing → ocr_complete → indexing → indexed`.
9. Click `Chat` in the header → ask a question about the document → watch tokens stream in → click a citation chip to see the source passage.
10. Open Jaeger (`http://localhost:16686`) → service `polaris-api` → find a trace with `rag.embed_question`, `rag.search`, `rag.generate` spans.
11. `just be-test` — should pass all 62 tests (38 from P0-P2 + 24 new from P3).
12. `just gen-api && git add frontend/lib/api/schema.gen.ts && git commit` — new `/api/chat/stream` route.

### Try the eval
13. In the browser DevTools console after sign-in: `await firebase.auth().currentUser.getIdToken()` → copy.
14. `POLARIS_EVAL_BEARER="<token>" GROQ_API_KEY="<key>" just eval` — generates `evals/reports/<ts>.md`. With the placeholder golden set, expect low scores — that's correct. Replace `evals/datasets/golden.jsonl` with real entries once you have a corpus.

### Commit + push
15. CI: backend tests + frontend build + openapi stale check + rules + secret-scan should all pass. Eval is `workflow_dispatch` only — won't run automatically.

---

## Known debt / "what I'd do next"

- **Real golden set.** 3 seed entries is a smoke test. Real value at ~30+ entries hand-curated from your actual notes. ADR 0007 says I'll target this by start of Phase 4.
- **Eval-on-PR auto-run** is deferred (free-tier CI can't reasonably index docs). Plan: hosted Qdrant + a snapshot corpus loaded at job start.
- **LangSmith** is unwired by code; works via env vars (`LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`) for any `langchain-*` calls we make. We currently only use `langchain-text-splitters` (no LLM calls through LC), so LangSmith captures essentially nothing today. Real wiring lands in Phase 5 when LangGraph agents enter.
- **Chat history persistence.** Conversations are page-local React state. Persisting `users/{uid}/chats/{chatId}/messages/...` to Firestore lands when we have a need (Phase 7 planner could use multi-turn history).
- **Cancellation propagation to Groq** is best-effort: we check `request.is_disconnected()` between events but don't explicitly cancel Groq's stream. Fix: pass `request` into `rag_service` and close the Groq stream on disconnect.
- **OTel context propagation API→Worker (still)** — same item as Phase 2. Trace screenshot is two separate roots, not one connected lineage.
- **No per-user rate limiting** on `/api/chat/stream`. slowapi lands in Phase 6.
- **Chunk size sweep eval** — promised in ADR 0008 as a Phase 4 task.

---

## Exercises

1. **Break the user_id filter on purpose.** Comment out the `must.append(user_id condition)` line in `qdrant_repo.search`. Run `pytest tests/unit/test_qdrant_repo.py` — the explicit-invariant test fails. Restore.
2. **Inspect a Groq stream raw.** From an authenticated session, in DevTools console: `fetch('/api/chat/stream', {method:'POST', headers:{Authorization:'Bearer '+await firebase.auth().currentUser.getIdToken(), 'Content-Type':'application/json'}, body:'{"question":"hi"}'}).then(r=>r.body.getReader().read().then(({value})=>console.log(new TextDecoder().decode(value))))` — see the SSE frames the parser is consuming.
3. **Force a Reprocess.** Re-upload the same PDF → `Reprocess` button → watch `ingest.complete` log appear → confirm Qdrant deduped (point count unchanged, not doubled).
4. **Tune chunk size.** Set `CHUNK_SIZE=400` in `backend/.env`, restart the worker, re-Reprocess one document, ask the same question, compare answer + citations to before. This is the manual loop the eval automates.
