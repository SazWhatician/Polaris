# Polaris — Build Plan (Engineer / Portfolio Edition)

## Context

You're building **Polaris**, an AI Academic Navigator that turns student notes + a syllabus into a coverage map, a learning-gap report, recommended resources, a revision plan, a knowledge graph, and ultimately a career-path recommender. The repo exists at `https://github.com/SazWhatician/Polaris`; the local folder is empty.

You're a working engineer who wants to **learn while building** and end up with a **portfolio project that holds up in a technical interview**. That reframes the plan: the deliverable isn't "it works", it's "it works, is tested, traced, evaluated, deployed, documented, and the README convinces a senior engineer in 90 seconds".

You've confirmed: free tiers (Firebase / Qdrant Cloud / Groq / NVIDIA NIM), Docker from day 1, plan-only now (resume per phase), GitHub repo already created.

---

## What "impresses interviewers" means here (the non-negotiables)

Every phase upholds these. They're what separates a polished portfolio project from a tutorial clone:

1. **Clear architectural boundaries.** Routes → services → repositories → models. No business logic in route handlers. No Firestore calls outside repository classes.
2. **Type safety end-to-end.** Pydantic models drive the OpenAPI schema; the frontend consumes types generated from that schema (`openapi-typescript`), so the contract can't drift.
3. **Async correctness.** No sync I/O inside `async def` handlers. Blocking calls (PaddleOCR, embedding model) run in a worker, not the request thread.
4. **Tests at three levels.** Unit (services, pure logic), integration (route + Firestore emulator + Qdrant), one happy-path Playwright test on the frontend by MVP. Coverage is reported, not gamed.
5. **Observability from day 1.** Structured JSON logs with request IDs, OpenTelemetry traces (free local Jaeger via docker-compose), token usage + latency captured per LLM call.
6. **Evals for anything LLM-driven.** From Phase 3 on, a `evals/` harness runs retrieval metrics (precision@k, MRR) and LLM-as-judge answer scoring against a small golden set. CI fails if scores regress.
7. **CI/CD from commit #1.** GitHub Actions: lint (ruff + eslint) → type-check (mypy + tsc) → test → build Docker image. Branch protection on `main`.
8. **Prompt versioning.** Prompts live in `backend/app/prompts/` as `.md` files, loaded by name + version. Changes are git-diffable; old versions stay until you delete them.
9. **Secrets discipline.** `.env*` and any `*serviceAccount*.json` in `.gitignore` from commit #1. Secrets injected via env vars only. Pre-commit hook (`gitleaks` or `detect-secrets`) blocks accidental commits.
10. **ADRs.** One short Architecture Decision Record per non-obvious choice, in `docs/adr/NNNN-title.md`. Interviewers love these — they prove you can defend choices.
11. **A README that sells the project.** Architecture diagram, demo GIF, "Why these choices", quickstart, link to live demo. Updated at the end of every phase.

---

## Architectural decisions (locked in once)

| Layer | Choice | Rationale (interviewer-defensible) |
|---|---|---|
| Frontend | Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui | Server Components for data fetching, RSC streaming, code-owned components (shadcn) over a UI library |
| Backend | FastAPI on Python 3.11, Pydantic v2 | Auto OpenAPI, async-native, type-driven contracts |
| Runtime | `docker-compose` (backend + Qdrant + Jaeger + Firebase emulator suite) | Spec-compliant, parity with prod, reproducible env |
| Auth | Firebase Auth (ID tokens verified server-side) | Free, battle-tested, lets you focus on app logic |
| DB | Firestore + Firestore security rules + emulator for tests | Spec choice; emulator means integration tests don't hit prod |
| Storage | Firebase Storage with backend-signed upload URLs | Browser uploads direct to GCS, backend never proxies bytes |
| OCR | PaddleOCR, run in a worker process (not in request handlers) | Heavy + blocking; isolating it keeps the API hot path fast |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` locally to start; swap to NV-Embed via NVIDIA NIM in Phase 9 once eval shows it's worth the latency | Lets the eval harness justify the upgrade — a story interviewers like |
| Vector DB | Qdrant Cloud free tier (1 GB) | Spec choice; payload filtering lets us multi-tenant safely |
| LLM | Groq (`llama-3.1-70b-versatile` or current free model) | Free + ~10× faster than other free options; OpenAI-compatible client |
| Agent FW | LangGraph | Explicit state graph = traceable + testable agents |
| Tracing | OpenTelemetry → Jaeger (local) + LangSmith free tier (LLM traces) | Standard tooling; LangSmith screenshots in README sell agent work |
| Task queue | `arq` (Redis-backed async queue) once OCR is real | Pure-asyncio, lighter than Celery, no `celery beat` baggage |
| Frontend deploy | Vercel hobby | Native Next.js |
| Backend deploy | Render free web service | Free, GitHub auto-deploy; documented cold-start is a fine tradeoff for a portfolio demo |

Tradeoffs intentionally **not** taken:
- **Supabase / Postgres + pgvector instead of Firebase + Qdrant** — would be a cleaner SQL story, but your spec calls Firebase + Qdrant and the eval/auth/storage maturity gains aren't worth derailing the roadmap. Add an ADR explaining this.
- **LlamaIndex** — its abstractions hide what makes the project a learning exercise. We use LangChain *only* for text-splitters and LangGraph for agents; retrieval and prompt assembly are written by hand.

---

## Repo layout (final shape, grows per phase)

```
Polaris/
├── backend/
│   ├── app/
│   │   ├── main.py                  (FastAPI app + middleware + router include)
│   │   ├── core/                    (config, logging, otel, firebase init, deps)
│   │   ├── api/                     (route modules — thin, only HTTP concerns)
│   │   ├── services/                (business logic; pure-ish, testable)
│   │   ├── repositories/            (Firestore + Qdrant data access)
│   │   ├── agents/                  (LangGraph graphs, one file per agent)
│   │   ├── prompts/                 (versioned .md prompts + loader)
│   │   ├── models/                  (Pydantic schemas — request/response/domain)
│   │   └── workers/                 (arq task definitions)
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/             (uses Firestore + Qdrant emulators)
│   │   └── conftest.py
│   ├── Dockerfile                   (multi-stage, distroless or slim)
│   ├── pyproject.toml               (ruff + mypy + pytest config)
│   ├── requirements.txt             (pinned)
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/                  (shadcn + features/)
│   ├── lib/
│   │   ├── api/                     (generated client from OpenAPI)
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── tests/                       (vitest unit + playwright e2e)
│   ├── package.json
│   └── .env.local.example
├── evals/                           (golden sets, runners, reports) — added Phase 3
│   ├── datasets/
│   ├── runners/
│   └── reports/
├── docker-compose.yml               (api, qdrant, jaeger, firebase emulators, redis)
├── docker-compose.override.yml      (dev-only overrides, gitignored)
├── .github/workflows/               (ci.yml, eval.yml, deploy.yml)
├── .pre-commit-config.yaml          (ruff, mypy, prettier, eslint, gitleaks)
├── docs/
│   ├── adr/                         (NNNN-title.md)
│   ├── architecture.md              (system + sequence diagrams, mermaid)
│   ├── phase-summaries/             (your learning journal, one per phase)
│   └── runbook.md
├── Justfile                         (just up / just test / just eval / just deploy)
├── .gitignore
├── LICENSE
└── README.md                        (sells the project)
```

---

## Cross-cutting tracks (mature alongside the phases)

These don't belong to a single phase — they grow over time. The plan calls out which phase each track enters.

| Track | Enters at | Grows by |
|---|---|---|
| **CI** | Phase 0 | Lint+type → +unit tests (P1) → +integration (P2) → +evals on PR (P3) → +build+deploy (P10) |
| **Testing** | Phase 0 | Healthcheck test → +service unit tests → +repository integration tests → +Playwright e2e at MVP |
| **Observability** | Phase 0 | Request IDs + JSON logs → +OTel traces (P2) → +LangSmith for LLM (P3) → +token/cost dashboards (P5) |
| **Evals** | Phase 3 | Golden set + retrieval metrics → +LLM-as-judge → +regression gate in CI → +per-agent suites (P5+) |
| **ADRs** | Phase 0 | One per non-obvious choice; aim for ~12–15 total by Phase 10 |
| **Demo artifacts** | Phase 0 | Screenshot → GIF → short Loom-style video in README by MVP |

---

## Per-phase deliverable contract (what every phase produces)

Every phase ends with **all** of:

1. A **PR-style summary** (`docs/phase-summaries/phase-N.md`) — what changed, why, screenshots, metrics where relevant.
2. **At least one ADR** capturing a non-trivial decision made in that phase.
3. **Tests** at whichever levels the new code warrants — never zero.
4. **Updated CI** if a new test type or service appeared.
5. **Updated README** — new feature called out, demo artifact updated.
6. A **clean, green main branch** after PR-style review (squash-merge).

---

## Phase 0 — Foundation + Engineering Spine (4–5 days)

**Goal:** `just up` brings up FastAPI + Qdrant + Jaeger + Firebase emulators. Next.js dev server runs on host. Google Sign-In works end-to-end. A protected `/api/me` round-trip succeeds with structured logging, trace ID propagation, and a green CI run.

**Concrete deliverables:**
- Multi-stage backend `Dockerfile` (slim final image, no build deps at runtime).
- `docker-compose.yml` with healthchecks + `depends_on: condition: service_healthy`.
- `core/config.py` using `pydantic-settings`, all env-driven, `.env.example` complete.
- `core/logging.py` — structlog JSON logs, request ID middleware.
- `core/otel.py` — OTel SDK wired to Jaeger; FastAPI + httpx instrumented.
- `core/firebase.py` — Admin SDK init from service account via env var path.
- `core/deps.py` — `verify_id_token` FastAPI dependency.
- Frontend: shadcn initialized, Firebase web SDK wired, `lib/api/client.ts` injects the ID token, dark mode toggle (table-stakes polish).
- `.pre-commit-config.yaml`, `Justfile`, `.github/workflows/ci.yml` (lint → type-check → test).
- ADR 0001: Firebase + Qdrant over Supabase + pgvector. ADR 0002: arq over Celery (decision recorded now, used in P2).
- README v1: name, one-paragraph pitch, architecture diagram (mermaid), quickstart, status badge.

**Learning beats:** OTel trace propagation Next → FastAPI → Jaeger; multi-stage Docker; Firebase Auth server-side verification; pre-commit gitleaks catching a fake leaked secret you intentionally commit then revert.

---

## Phase 1 — Auth & Document Management (3–4 days)

**Goal:** Authenticated users upload PDFs/images (direct-to-storage via signed URLs), see them in a dashboard, delete them. Firestore stores metadata. Security rules + tenant scoping enforced.

**Concrete deliverables:**
- `api/documents.py`, `services/document_service.py`, `repositories/document_repo.py`, `models/document.py`.
- Backend issues v4 signed URLs for upload — never proxies file bytes.
- Firestore security rules: a user can only read/write under `users/{uid}/...`. Rules tested with `@firebase/rules-unit-testing` in CI.
- Frontend: `/dashboard` with upload + list + delete; optimistic UI with rollback on failure; toast notifications via shadcn.
- Generated TypeScript client (`openapi-typescript`) wired into a `just gen-api` task; `.github/workflows/ci.yml` fails if the committed client is stale.
- Integration tests against Firestore emulator: upload metadata create, list scoped by uid, cross-tenant access denied.
- ADR 0003: signed URLs vs proxy uploads.

**Learning beats:** Firestore security rules as code (and as tests), OpenAPI-driven client generation, optimistic UI patterns, request scoping in middleware.

---

## Phase 2 — OCR Pipeline (5–6 days)

**Goal:** Uploaded files transition `uploaded → queued → processing → ocr_complete | failed`. OCR runs in an `arq` worker, not the request thread. Page-level extracted text lands in Firestore. Re-processing is idempotent.

**Concrete deliverables:**
- New `worker` service in `docker-compose.yml`, shares image with API but different entrypoint.
- `redis` service added (for arq).
- `workers/ocr_worker.py` — task with retry policy, exponential backoff, dead-letter logging.
- `services/ocr_service.py` — orchestrates: download from storage → split PDF pages with `pypdf` → preprocess image with PIL → call PaddleOCR → write `pages` sub-collection.
- PaddleOCR models baked into the Docker image (avoid 1.5 GB re-download per container restart).
- Idempotency: a content hash (sha256 of source file) keyed on document; re-running on the same hash short-circuits.
- OTel spans wrap each OCR task; Jaeger shows the full async pipeline.
- Tests: unit on the page-splitter; integration on the worker with a small fixture PDF; status-machine tests (invalid transitions rejected).
- ADR 0004: arq over Celery / RQ for this workload.
- Phase summary includes a Jaeger screenshot of an OCR trace.

**Learning beats:** Worker patterns, idempotent processing, retry semantics, multi-process Dockerfile (`CMD` differs by service), distributed tracing across processes.

---

## Phase 3 — Vector Search + RAG Chat + Eval Harness (8–10 days) — **MVP**

**Goal:** User asks a question, gets a streamed answer with page-level citations grounded in their notes. **And** there's an `evals/` harness that scores retrieval and answer quality on a golden set, runnable locally (`just eval`) and in CI on PRs touching retrieval or prompts.

**Concrete deliverables:**
- `services/chunking_service.py` (LangChain `RecursiveCharacterTextSplitter` with sensible CS-friendly settings).
- `services/embedding_service.py` (sentence-transformers; batched; cached by chunk hash).
- `repositories/qdrant_repo.py` (collection-per-environment, payload filter `user_id` enforced on every query — multi-tenant safety).
- `services/rag_service.py` — retrieval → context assembly → prompt build (from versioned prompt file) → Groq stream.
- `api/chat.py` with SSE streaming + cancellation propagation (client abort → cancel Groq stream).
- Prompt: `prompts/rag_answer/v1.md`, loaded via `prompts.load("rag_answer", "v1")`.
- Frontend `/chat`: streamed tokens, citation chips that expand to source page snippets, copy-to-clipboard, chat history persisted in Firestore.
- LangSmith wired (free tier) — every chat run produces a trace.
- **Eval harness:** `evals/datasets/cs_networking_golden.jsonl` (~30 Qs you hand-curate against a sample syllabus), `evals/runners/retrieval_eval.py` (precision@k, recall@k, MRR), `evals/runners/answer_eval.py` (LLM-as-judge with a stronger model — Groq's largest available, scored on grounding/correctness/completeness). Markdown report at `evals/reports/<date>.md`.
- `.github/workflows/eval.yml` — runs the eval suite when retrieval code or prompts change; comments scores on the PR; fails if regression > 5%.
- ADR 0005: eval methodology (golden-set construction, judge model choice, regression threshold).
- ADR 0006: chunking strategy + chunk size choice (with eval numbers backing it).
- README updated with a demo GIF + a "RAG quality" section showing eval scores.

**Learning beats:** Embedding intuition + cosine similarity, payload-filtered multi-tenant vector search, streaming + cancellation, prompt versioning, eval-driven prompt iteration, LLM-as-judge pitfalls (bias toward verbose answers, etc.).

**This is your MVP and a defensible interview talking point on its own.** You can ship here.

---

## Phase 4 — Syllabus Intelligence (6–8 days)

**Goal:** Upload syllabus → LLM extracts structured topic tree → each topic gets a coverage score derived from notes retrieval + LLM rubric. Coverage view in UI.

**Concrete deliverables:**
- `services/syllabus_service.py` — JSON-mode LLM call with Pydantic-validated output; retry with corrective prompt on schema failure.
- `models/syllabus.py` — `Topic`, `TopicTree`, `Coverage` schemas.
- `repositories/syllabus_repo.py`.
- Topic-coverage scorer: combines `count(retrieved_chunks above threshold)` and an LLM rubric score; both weights configurable.
- Frontend `/syllabus`: tree view (shadcn `Accordion` or a simple recursive component), per-topic `Progress` bar, drill-down to source chunks.
- Tests: golden-syllabus → expected-topic-tree snapshot test (regenerate-on-diff pattern).
- ADR 0007: structured LLM output strategy (JSON mode + Pydantic validation + corrective retry).

**Learning beats:** Structured LLM output reliability, schema-driven LLM calls, defining + defending a metric (coverage scoring is a real product decision).

---

## Phase 5 — Learning Gap Agent (LangGraph proper) (6–8 days)

**Goal:** A LangGraph agent classifies syllabus topics as Known / Weak / Missing, ranks them by importance + prerequisite order, recommends what to study next. Agent state is persisted; runs are resumable and traceable.

**Concrete deliverables:**
- `agents/gap_agent.py` — LangGraph with nodes: `load_syllabus → load_coverage → assess → rank → recommend`. Edges include a conditional retry from `assess`.
- State checkpoint to Firestore (LangGraph's `Checkpointer` interface) — interrupted runs resume.
- LangSmith traces per node (interviewer screenshot material).
- Per-agent eval suite: `evals/runners/gap_eval.py` against a hand-labeled coverage→gap dataset.
- Frontend `/gaps`: three columns, draggable priority reorder (saved per user), "Why?" tooltip that shows the agent's reasoning.
- ADR 0008: state persistence + resumability strategy.

**Learning beats:** LangGraph state machines, checkpointing, conditional edges, separating cheap deterministic nodes (retrieval) from expensive LLM nodes (judgment), how to test an agent (per-node unit + full-graph integration).

---

## Phase 6 — Resource Discovery Agent (5–6 days) — **DIFFERENTIATED PRODUCT**

**Goal:** For any weak/missing topic, recommend curated free resources ranked by quality + user-level appropriateness. Aggressive caching to stay inside free quotas.

**Concrete deliverables:**
- `services/youtube_service.py` (YouTube Data API v3, quota-aware, cached in Firestore by `topic_hash` with TTL).
- Optional `data/seed_channels.json` for known-good educators (3Blue1Brown, Computerphile, Neso Academy, freeCodeCamp, etc.) — a small editorial layer that beats raw search.
- `agents/resource_agent.py` — LangGraph: `search → dedupe → rank (LLM rubric) → enrich`.
- Frontend `/resources/[topic]` cards with thumbnail, channel, duration, "why this" blurb from the ranker.
- Rate-limiting middleware (`slowapi`) — per-user, not per-IP.
- ADR 0009: rate-limiting + caching strategy for third-party APIs.

**Learning beats:** Third-party API quota management, multi-source aggregation + dedup, LLM-as-ranker rubrics.

---

## Phase 7 — Revision Planner Agent (4–5 days)

**Goal:** Given exam date + coverage + user's hours-per-day, generate a day-by-day plan. Plans are diffable across runs (user sees what changed when they re-plan).

**Concrete deliverables:**
- `agents/planner_agent.py` — produces structured `Plan` (days → topics → time blocks).
- Plan diff service — shows added/removed/moved items between consecutive plans.
- Frontend `/plan` with calendar view (`react-day-picker`), per-day topic breakdown, diff highlight.
- Eval: schedule sanity (no overallocation, no missing high-priority topics, totals match available hours).
- ADR 0010: plan representation + diff algorithm.

**Learning beats:** Constraint satisfaction in prompts, generating reproducible structured outputs, semantic diffing of LLM outputs.

---

## Phase 8 — Knowledge Graph Engine (8–10 days)

**Goal:** Concepts + relationships extracted from notes, persisted, browsable as an interactive graph that links nodes back to source pages.

**Concrete deliverables:**
- `services/concept_extraction.py` — spaCy NER + LLM-assisted concept + relationship extraction (`(concept_a, relation, concept_b)` triples), deduped via embedding similarity.
- `repositories/graph_repo.py` — store nodes/edges in Firestore + materialized NetworkX graph cached on the API for fast queries.
- Community detection (`networkx.community.louvain_communities`) → colored clusters.
- Frontend `/graph` with `react-cytoscapejs`, click-to-source panel, search, layout toggles.
- ADR 0011: graph storage (denormalized in Firestore + in-memory NetworkX vs graph DB like Neo4j — pick + defend).
- Eval: precision/recall of extracted triples against a hand-labeled fixture.

**Learning beats:** NER, relation extraction, graph algorithms (centrality, communities), interactive graph UX, when a graph DB is and isn't worth it.

---

## Phase 9 — Academic Digital Twin (8–10 days)

**Goal:** Persistent model `{knownConcepts, weakConcepts, learningVelocity, prerequisitesNeeded[]}` per user, updated incrementally as they study. Answer "Can I learn Transformers?" with a Ready/Missing breakdown rooted in the Phase 8 graph.

**This phase justifies the NV-Embed upgrade** — run an eval comparing MiniLM vs NV-Embed on the gap/concept tasks; keep the better one, document the decision in an ADR with numbers.

**Concrete deliverables:**
- `services/twin_service.py` — incremental update on every chat / OCR / syllabus event.
- `agents/twin_agent.py` — answers readiness queries via graph traversal + LLM reasoning.
- Velocity = simple time-series of new concepts known per week, with a smoothed trend.
- Frontend `/twin`: profile view + "Can I learn X?" input → readiness card.
- ADR 0012: embedding upgrade decision (with eval data).
- ADR 0013: twin update strategy (event-driven vs scheduled).

**Learning beats:** Stateful user modeling, event-driven state updates, graph traversal for prerequisites, defensible model comparison.

---

## Phase 10 — Pathfinder Career Agent + Production Deploy (8–10 days)

**Goal:** User picks a career goal → agent composes Gap + Resource + Twin agents → returns skill-gap analysis, recommended projects, curated learning path. Whole system is deployed publicly.

**Concrete deliverables:**
- `data/career_roadmaps.json` — seeded with ML Engineer, Backend, Data Scientist, SWE (you maintain this; small editorial dataset).
- `agents/pathfinder_agent.py` — composes other agents, returns structured `CareerPlan`.
- Frontend `/pathfinder` with goal input, gap viz, project cards, exportable plan.
- Deploy: frontend to Vercel, backend to Render (free tier), Qdrant on Qdrant Cloud, Firebase prod project (separate from dev). `.github/workflows/deploy.yml`. Secrets in Render + Vercel env vars.
- Production hardening pass: rate limits tightened, error budgets logged, Firebase rules locked down to least-privilege, Sentry free tier wired for both frontend + backend.
- README v2: live demo URL, Loom-style walkthrough video link, architecture diagram, eval scores, ADR index, "what I'd do next" section.
- ADR 0014: deployment topology + cold-start tradeoff.

**Learning beats:** Multi-agent composition, production hardening, public-deploy considerations (CORS, cookies, CSP), portfolio README craft.

---

## Phase 11 — Ambient Study Layer (PageAgent + LiteRT.js) (6–8 days) — **POST-DEPLOY DIFFERENTIATOR**

> Detailed spec: [`docs/proposals/phase-11-ambient-study-layer.md`](proposals/phase-11-ambient-study-layer.md).

**Goal:** Close the loop between "Polaris recommends" and "student actually learns" by observing real-world learning behavior across the browser, all with on-device privacy. Adds two independently-shippable pieces on top of the deployed Phase 10 system:

1. An **in-page copilot** inside Polaris using [alibaba/page-agent](https://github.com/alibaba/page-agent) as a natural-language shell over every existing agent endpoint.
2. A **cross-tab Chrome extension** that uses PageAgent's extension mode + [LiteRT.js](https://developers.googleblog.com/litertjs-googles-high-performance-web-ai-inference/) (quantized MiniLM on-device via WebGPU) to detect when the user is reading/watching content related to one of their weak/missing topics, and pipes that as a passive study signal into the Phase 9 digital twin.

**Concrete deliverables:**
- **Backend:** `app/api/twin_signals.py` (`POST /api/twin/signals`, rate-limited), `app/api/graph_embeddings.py` (`GET /api/graph/topic-embeddings` snapshot), `app/services/twin_signal_service.py`, optional `app/api/agent_llm.py` proxy.
- **Frontend copilot:** `frontend/lib/page-agent/` wrapper + capability registry, `frontend/components/agent-copilot.tsx`, systematic `data-agent-target` attributes across all interactive routes.
- **Chrome extension** (new sibling app under `extension/`): Manifest V3 + TypeScript, Readability content extraction, LiteRT.js WebGPU embedding of visible page text against locally-cached topic-embedding snapshot, engagement heuristics per site type, popup UI for allowlist + sync.
- **On-device model asset:** quantized `all-MiniLM-L6-v2.int8.tflite` (~25 MB), hosted via Firebase Storage with immutable cache.
- **Evals:** classification-precision on a 150-URL hand-labeled fixture (target precision@1 ≥ 0.75 at recall 0.60); parity check between on-device and server MiniLM (target Spearman ρ ≥ 0.90 on top-10 topic ranks). CI gates the phase.
- **ADRs:** 0015 (in-page-agent LLM key boundary — proxy vs. client), 0016 (on-device embedding parity envelope + fallback rule), 0017 (passive-signal schema + privacy discipline).
- Playwright end-to-end: user opens a fixture external page → extension shows badge → simulated engagement → Polaris `/twin` reflects the signal within one twin-update tick.

**Learning beats:** In-page GUI agents vs. server-side LangGraph agents (who owns state), on-device inference tradeoffs (WebGPU vs. WASM, quantization impact on retrieval), cross-tab collection with actual privacy discipline, closing agent loops (recommend → observe consumption).

**Interview story:** "Every AI study app knows what you clicked inside it. Polaris knows what you actually watched on YouTube — and does the classification on your device so nothing leaves your browser unless it matches one of your own weak topics."

---

## Verification (applies every phase)

- `just up` brings up the stack; `just test` is green; `just eval` (from P3) reports no regression.
- `docker-compose ps` shows healthy services with healthchecks.
- Jaeger UI shows traces for the new functionality.
- CI is green on the merge commit; branch protection enforced this.
- Phase summary written, ADR(s) merged, README updated, screenshot/GIF refreshed.

---

## Per-phase summary format (what I deliver at the end of each phase)

`docs/phase-summaries/phase-N.md`:

1. **Headline + outcome** — one line.
2. **PR diff summary** — `path | created/modified/deleted | purpose`. Grouped by layer (backend/frontend/infra/docs).
3. **ADRs written this phase** — title + one-line rationale + link.
4. **Tests added** — count by level (unit / integration / e2e) + coverage delta.
5. **Eval impact** (from P3+) — before/after retrieval metrics + answer-judge scores.
6. **Observability artifacts** — Jaeger trace screenshot, LangSmith link, log snippet.
7. **Concepts to internalize** — bulleted with one-line "why this matters at interview" rationale.
8. **Gotchas hit and resolved** — short list (becomes runbook material).
9. **What I'd do next / known debt** — honest list; interviewers respect this.

---

## What I'll do when you say "start phase N"

1. Re-read previous phase summary + ADR index to ground myself.
2. Open a TaskList for the phase's deliverables.
3. Implement incrementally; explain non-obvious choices inline; write tests alongside code, not after.
4. Run `just test` + (from P3) `just eval` before declaring done.
5. Write the phase summary doc + new ADR(s).
6. Stop. Wait for your review.

---

## Open loops worth knowing about now

- **Firebase emulator suite** — non-trivial to wire into CI on Windows runners; we'll use `ubuntu-latest` runners in GitHub Actions and `firebase emulators:exec` for tests. ADR-worthy if it gets fiddly.
- **LangSmith free tier** is 5k traces/month — enough for dev + portfolio; we sample at 100% in dev, 10% in any deployed env.
- **Groq free tier** rate limits (~30 RPM on free models) — Phase 3's response cache and Phase 6's API cache keep us well under. The eval harness deliberately rate-limits itself.
- **Qdrant Cloud free** is 1 GB / 384-dim ≈ ~600K chunks. Fine. NV-Embed (4096-dim) shrinks that to ~50K — we'll re-evaluate at Phase 9 whether the upgrade requires moving to self-hosted Qdrant.
- **Render free backend** sleeps after 15 min — fine for portfolio. If you want zero cold-start later, Fly.io's free tier or Railway's $5 credit are options; ADR if/when you choose.
- **PaddleOCR model size** — bake into image during Phase 2; expect Docker image to hit ~2.5 GB. That's normal for this workload; document it.
