# Phase 2 — OCR Pipeline

> **Outcome:** A finalized upload flows automatically into the OCR worker. Documents transition `uploaded → queued → processing → ocr_complete | failed`. Page-level text + per-page confidence lands in Firestore. Re-running OCR on identical bytes short-circuits via a content hash. The dashboard polls in-flight docs, lets you view extracted text, and lets you re-run failed jobs.

---

## Files created/modified (grouped by layer)

### Backend — pure modules
| Path | Purpose |
|---|---|
| `app/services/hashing.py` | One function: `sha256_hex(bytes) -> str` for idempotency |
| `app/services/status_transition.py` | `VALID_TRANSITIONS` map + `assert_transition()` — single source of truth for the state machine |
| `app/services/page_extractor.py` | `extract_pages(blob_bytes, mime_type, render_scale)` — PDF→PIL via pypdfium2, image passthrough; lazy heavy imports so the module is safe in the API container |

### Backend — services & repos
| Path | Purpose |
|---|---|
| `app/services/storage_service.py` (modified) | Added `download_bytes(path)` for the worker |
| `app/services/task_queue.py` | `TaskQueue` Protocol + `ArqTaskQueue` adapter + `make_arq_pool()` |
| `app/services/ocr_service.py` | Orchestration: download → hash → idempotency check → render pages → OCR → persist; OTel spans on `ocr.process` + `ocr.page`; failure path marks doc FAILED + re-raises |
| `app/repositories/page_repo.py` | Firestore CRUD for `users/{uid}/documents/{docId}/pages/{N}`; batched writes (Firestore 500-op limit); delete-then-write for idempotent rewrites |
| `app/services/document_service.py` (modified) | `finalize_upload` enqueues OCR + transitions to QUEUED *after* enqueue succeeds; new `reprocess()` method |
| `app/models/document.py` (modified) | Added `page_count`, `ocr_completed_at`; new `Page` + `PageListResponse` models |
| `app/repositories/document_repo.py` (modified) | Persist the new fields |
| `app/core/config.py` (modified) | `redis_url`, `ocr_max_pages`, `ocr_render_scale`, `ocr_job_timeout_seconds`, `ocr_max_retries` |

### Backend — worker
| Path | Purpose |
|---|---|
| `app/workers/__init__.py` | Marker |
| `app/workers/paddle_engine.py` | `PaddleOcrEngine` (implements `OcrEngine` Protocol); BGR conversion; aggregates per-line text + avg confidence |
| `app/workers/ocr_worker.py` | arq `WorkerSettings` with `max_jobs=1`, `max_tries=3`, `job_timeout=600` · `_startup` configures logging/tracing/firebase + builds the PaddleOcrEngine once · `ocr_document` task |

### Backend — API
| Path | Purpose |
|---|---|
| `app/api/documents.py` (modified) | `get_task_queue` dep · pass queue into `DocumentService` · `POST /api/documents/{id}/reprocess` route |
| `app/api/pages.py` | `GET /api/documents/{id}/pages` — owner-scoped page listing |
| `app/main.py` (modified) | Lifespan creates the arq pool, attaches `ArqTaskQueue` to `app.state.task_queue`, closes on shutdown |

### Backend — tests
| Path | New count |
|---|---|
| `tests/unit/test_status_transition.py` | 4 (exhaustive map check + 7-param valid + 6-param invalid) |
| `tests/unit/test_hashing.py` | 4 |
| `tests/unit/test_page_extractor.py` | 3 (with `importorskip` so it skips if pypdfium2 absent) |
| `tests/unit/test_ocr_service.py` | 6 (happy path · idempotency · invalid-state refusal · failure → FAILED · max-pages cap · missing doc) |
| `tests/unit/test_document_service.py` (modified) | +2 (`reprocess` happy path · `reprocess` rejects invalid state); existing tests updated for the new `task_queue` param |
| `tests/integration/test_ocr_pipeline_end_to_end.py` | 1 (marked `slow + integration` — opt-in via `pytest -m integration`) |

### Frontend
| Path | Purpose |
|---|---|
| `lib/api/documents.ts` (modified) | `listPages(id)` · `reprocessDocument(id)` · `PageItem` type |
| `components/ui/dialog.tsx` | shadcn Dialog primitive |
| `components/pages-viewer.tsx` | Modal that fetches + renders per-page OCR text with confidence |
| `components/document-list.tsx` (rewritten) | Loader spinner badge for in-flight states · Eye button for OCR-complete · Reprocess button for failed/complete · inline error text · optimistic-with-rollback reprocess |
| `app/dashboard/page.tsx` (modified) | Background poll every 3 s while any doc is `queued`/`processing` (ref-based to avoid restart loops) |

### Infra
| Path | Purpose |
|---|---|
| `backend/requirements.txt` (modified) | `arq`, `redis`, `pillow`, `pypdfium2`, `numpy` in base |
| `backend/requirements-ocr.txt` | `-r requirements.txt` + `paddleocr` + `paddlepaddle` |
| `backend/Dockerfile.worker` | Multi-stage; OpenCV runtime libs; **bakes PaddleOCR models at build time** (avoids 500 MB cold download) |
| `docker-compose.yml` (rewritten) | New `redis` service (healthcheck) + new `worker` service (uses `Dockerfile.worker`); `api` waits for `redis` healthy |
| `docker-compose.override.yml{.example}` (modified) | Mount Firebase SA into worker too |
| `backend/.env{.example}` (modified) | `REDIS_URL`, `OCR_MAX_PAGES`, `OCR_RENDER_SCALE` |

### Docs
| Path | Purpose |
|---|---|
| `adr/0005-idempotent-ocr-via-content-hash.md` | Why SHA-256 + `max_jobs=1` |
| `adr/0006-pypdfium2-over-pdf2image-pymupdf.md` | License + system-dep tradeoffs |
| `architecture.md` (modified) | Phase 2 system diagram with worker + redis + storage flow arrows |
| `phase-summaries/phase-2.md` | This document |

---

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/documents/{id}/reprocess` | Bearer | Re-enqueue OCR; allowed from `UPLOADED`, `OCR_COMPLETE`, or `FAILED` |
| GET | `/api/documents/{id}/pages` | Bearer | Owner-scoped; returns `Page[]` ordered by page number |

---

## State machine

```
REQUESTED → UPLOADED   (POST /finalize, blob exists)
UPLOADED  → QUEUED     (POST /finalize, after enqueue succeeds)
QUEUED    → PROCESSING (worker starts the job)
PROCESSING → OCR_COMPLETE | FAILED (worker finishes)
OCR_COMPLETE → QUEUED  (POST /reprocess)
FAILED       → QUEUED  (POST /reprocess)
```

Every other transition raises `InvalidTransitionError`. The state machine is tested exhaustively in `tests/unit/test_status_transition.py`.

---

## Concepts to internalize (interview-framed)

| Concept | Why it matters in an interview |
|---|---|
| Async task queue with `arq` | "How do you offload work from a web request?" — pool in API, dequeue in worker, both connected by Redis |
| Idempotency via content hash | Classic distributed-systems pattern; same idea behind Stripe's idempotency keys |
| State machine as code + tests | Drift is the #1 source of "but it was working" bugs; codify transitions, test exhaustively |
| Single-job-per-worker for CPU-bound work | GIL discussion; defending `max_jobs=1` vs the naive "just turn the concurrency up" answer |
| Multi-image Docker strategy | Two Dockerfiles, two `requirements*.txt` — API stays lean, worker carries the heavy OCR deps |
| Baking models at build time | Avoids 500 MB cold start; ADR 0005 explains the tradeoff (image size vs latency) |
| Protocol-based engine abstraction | `OcrEngine` Protocol means tests use `FakeEngine` and prod uses `PaddleOcrEngine` — no service changes when we swap to NVIDIA NIM |
| OTel spans across processes | API span (enqueue) + worker span (process) share trace context propagated by arq — visible as one trace in Jaeger |
| Lazy imports | `paddleocr` only imports inside `PaddleOcrEngine.__init__` so the API container can import the module without the dep — saves 1.5 GB |
| Optimistic UI with rollback for reprocess | The dashboard flips the badge to "queued" the moment the user clicks; rolls back if the API call errors |
| Status polling with ref-based latest state | Prevents the classic "useEffect interval that captures stale state" bug |

---

## Gotchas you'll hit (and the fix)

1. **First `docker-compose build worker` is slow.** PaddlePaddle + PaddleOCR + model bake = ~10 minutes on a cold cache. After that, layer caching makes subsequent builds fast unless `requirements-ocr.txt` changes.
2. **Worker container OOMs on a big PDF.** Each page renders to RAM at `render_scale=2.0`; a 200-page color PDF can spike past 4 GB. Cap with `OCR_MAX_PAGES` (default 200) and `OCR_RENDER_SCALE` (default 2.0). For Docker Desktop on Windows, give the VM at least 6 GB.
3. **`firebase_admin` initialization in the worker is required and non-fatal in the API.** The worker `_startup` raises if Firebase fails to init; the API logs and continues. Different policies for different processes — documented in `app/workers/ocr_worker.py:_startup`.
4. **arq enqueues fail silently if Redis is down at API startup.** The lifespan logs `app.task_queue.unavailable` and leaves `app.state.task_queue = None`. Any subsequent enqueue returns 503 — fine for dev, surprise-able in prod. Document as known debt to plumb a health-aware reconnect.
5. **`asyncio.to_thread` doesn't propagate OTel context.** Currently fine because Firestore calls are leaves. If we ever wrap an instrumented client with `to_thread` we'll lose the span lineage. The OTel team has `opentelemetry-context` patterns for this — picked up if/when it bites.
6. **Polling at 3 s wastes calls when nothing's happening.** Mitigated: the tick no-ops when no doc is in flight. If you ever ship many users, switch to a server-sent events stream from `GET /api/documents/stream`.
7. **PaddleOCR `show_log=False` doesn't silence everything.** The first import dumps build-time info. Pinned `paddleocr==2.7.3` is the quietest we get on Phase 2.
8. **Re-OCR after changing `OCR_RENDER_SCALE` is incorrectly skipped.** Idempotency keys on content hash only — changing render scale changes OCR quality but doesn't bust the cache. Documented in ADR 0005. Workaround: bump a config flag and include it in hash input. Not implemented yet because we don't change this knob.

---

## What you do next (before saying "start phase 3")

1. `cd backend && pip install -r requirements.txt` to pick up `pillow`, `pypdfium2`, `numpy`, `arq`, `redis`.
2. `cd frontend && npm install` (no new deps actually, but lock should match).
3. `just up` — first build will be slow because of `Dockerfile.worker` and PaddleOCR model bake (10–15 min on a fresh machine). Subsequent `just up` is fast.
4. `docker-compose logs -f worker` — wait for `worker.startup ... engine=paddleocr-2.7`. The arq worker is now polling Redis.
5. Visit the dashboard, upload a PDF or image. Within a few seconds the status badge flips through `queued → processing → ocr_complete`. Click the eye icon to see extracted text.
6. Open Jaeger at http://localhost:16686 → service dropdown → `polaris-api` then `polaris-worker` → find the `POST /api/documents/{id}/finalize` trace (api) and the corresponding `ocr.process` trace (worker) — screenshot them for the README demo.
7. `just be-test` → all unit tests pass (previously 19 from P0/P1, now +19 from P2 = 38).
8. `cd backend && pytest -m integration` (optional) — runs the slow end-to-end test against a real PDF render.
9. `just gen-api && git add frontend/lib/api/schema.gen.ts && git commit` — the new `/reprocess` + `/pages` routes changed the OpenAPI surface.
10. Commit + push.

---

## Known debt / "what I'd do next"

- **No real integration test with Redis + a live worker** — the `tests/integration/` test exercises `OcrService` directly. A docker-compose-up-in-CI test could exercise the full enqueue→worker→Firestore flow but adds runner cost. Defer to Phase 3 when CI density grows.
- **No backpressure**: if a user uploads 100 PDFs at once, the worker churns through them serially while the queue grows. No bounded enqueue, no per-user concurrency cap. Easy fix in Phase 6 alongside slowapi.
- **Polling instead of SSE/WebSocket**: 3 s polling is "good enough" for one user. SSE stream from a Firestore listener would be cleaner. Defer.
- **Page text shown raw** in the viewer — no syntax highlighting, no markdown rendering of equations. Phase 3 RAG citations will get a better UX.
- **No reprocess from `UPLOADED` in the UI** — only `failed` and `ocr_complete` get the Reprocess button. The backend allows it. Trivial UI add when needed.
- **Worker scaling isn't documented in the README** — `docker-compose up -d --scale worker=N` works today; needs a one-liner in the runbook.
- **OTel context across `arq` enqueue→dequeue not yet propagated** — currently the API trace and the worker trace are separate roots. Easy fix: serialize the trace context into the job kwargs and re-attach in `_startup`. Phase 3 task if interview-relevant.

---

## Exercises

1. **Force the idempotency short-circuit.** Upload a PDF; wait for `ocr_complete`. Click Reprocess. Watch worker logs — you should see `ocr.skipped_unchanged` and no PaddleOCR run.
2. **Break a transition on purpose.** In `firestore.rules`, manually edit a doc's `status` to `processing` via Firebase Console. Trigger reprocess. Watch the API return 409 with the state machine error.
3. **Trace a job across processes.** Open Jaeger → find the `POST /api/documents/{id}/finalize` trace from the api service. Then find the matching `ocr.process` trace under `polaris-worker`. They're currently separate roots; the known-debt item explains how you'd link them.
4. **Read `app/services/ocr_service.py:process`** end-to-end and explain in your own words why the `assert_transition` call comes *before* `update_status(PROCESSING)`. (Hint: idempotency.)
