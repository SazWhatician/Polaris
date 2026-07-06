# Phase 0 — Foundation + Engineering Spine

> **Outcome:** `just up` boots FastAPI + Qdrant + Jaeger. Next.js dev server runs on host, signs you in with Google, and round-trips a Firebase ID token through `/api/me`. CI lints, type-checks, tests, and builds both stacks. Every non-obvious choice is captured in an ADR.

---

## Files created (grouped by layer)

### Backend (`backend/`)
| Path | Purpose |
|---|---|
| `pyproject.toml` | ruff (lint + format) · mypy (strict) · pytest (asyncio mode + coverage) config |
| `requirements.txt` | Pinned deps: FastAPI · Pydantic · structlog · OpenTelemetry · firebase-admin · httpx · pytest |
| `.env.example` | Documented env contract; commit-safe template |
| `Dockerfile` | Multi-stage: builder installs into `/opt/venv`, runtime copies venv + app, runs as non-root, has HTTP healthcheck |
| `.dockerignore` | Excludes caches, secrets, tests from the image |
| `app/main.py` | App factory: load config → configure logging → configure tracing → register middleware → include routers → instrument FastAPI |
| `app/core/config.py` | `pydantic-settings` singleton (`lru_cache`'d); env-driven; `cors_origins` helper |
| `app/core/logging.py` | structlog JSON in prod / console in dev · `RequestIdMiddleware` (ContextVar) · echoes `X-Request-Id` header |
| `app/core/otel.py` | OTel SDK · OTLP gRPC exporter to Jaeger · auto-instruments FastAPI + httpx |
| `app/core/firebase.py` | Idempotent Admin SDK init · falls back to "not initialized" cleanly (so `/health` works without secrets) |
| `app/core/deps.py` | `verify_id_token` FastAPI dependency · maps `Expired/Revoked/Invalid` to specific 401 reasons |
| `app/api/health.py` | `GET /health` — public; exposes `firebase_ready` for dashboard checks |
| `app/api/me.py` | `GET /api/me` — protected; returns the authenticated user from token claims |
| `app/models/user.py` | `AuthenticatedUser` Pydantic model (frozen) |
| `tests/conftest.py` | Test env defaults · async httpx client fixture · lifespan-aware |
| `tests/unit/test_health.py` | Healthcheck + request-ID middleware tests |
| `tests/unit/test_me_requires_auth.py` | 503 when Firebase unconfigured · 401 when bearer missing |

### Frontend (`frontend/`)
| Path | Purpose |
|---|---|
| `package.json` | Next 15 · React 19 · Tailwind 3 · shadcn deps · `openapi-typescript` for generated API client |
| `tsconfig.json` | Strict + `noUncheckedIndexedAccess` + path alias `@/*` |
| `next.config.mjs` | React strict mode + typed routes |
| `tailwind.config.ts` | shadcn theme variables wired |
| `components.json` | shadcn CLI config (so future `npx shadcn add ...` works) |
| `.env.local.example` | Documented Firebase web SDK config |
| `app/layout.tsx` | Root layout · `next-themes` provider · Inter font |
| `app/page.tsx` | Sign in with Google · call `/api/me` · render result |
| `app/globals.css` | Tailwind + shadcn CSS variables for light + dark |
| `lib/firebase.ts` | Client SDK init (singleton) · `signInWithGoogle` · `signOut` · `getIdToken` |
| `lib/api/client.ts` | Typed `api<T>()` fetch wrapper · injects ID token · throws `ApiError` |
| `lib/utils.ts` | shadcn `cn` helper (clsx + tailwind-merge) |
| `components/theme-provider.tsx` | next-themes wrapper (client component) |
| `components/theme-toggle.tsx` | Sun/moon button |
| `components/ui/button.tsx` | shadcn Button (CVA variants) |
| `components/ui/card.tsx` | shadcn Card primitives |

### Infra & tooling (repo root)
| Path | Purpose |
|---|---|
| `docker-compose.yml` | `api` (hot-reload bind mount, healthcheck) · `qdrant` · `jaeger` (OTLP + UI) · named network |
| `docker-compose.override.yml.example` | Template for mounting the Firebase service-account JSON when ready |
| `Justfile` | `just up/down/logs/check/be-*/fe-*` — single entrypoint for every dev task |
| `.pre-commit-config.yaml` | trailing-whitespace · EOF · YAML/TOML/JSON checks · large-file guard · detect-private-key · ruff · gitleaks · prettier |
| `.github/workflows/ci.yml` | 3 parallel jobs: backend (ruff/mypy/pytest) · frontend (lint/type/build) · gitleaks scan |
| `.gitignore` | Secrets first; then Python/Node/Docker caches |
| `LICENSE` | MIT |
| `README.md` | Pitch · stack · quickstart · phase progress table · ADR index link |

### Docs (`docs/`)
| Path | Purpose |
|---|---|
| `adr/README.md` | ADR index |
| `adr/0000-template.md` | Template for new ADRs |
| `adr/0001-firebase-qdrant-vs-supabase-pgvector.md` | Why we didn't go Supabase |
| `adr/0002-arq-over-celery-for-async-workers.md` | Why arq when we add the worker in Phase 2 |
| `architecture.md` | Mermaid system + target diagrams · auth sequence diagram · layer boundaries · multi-tenant rule |

---

## ADRs written this phase
- **0001** — Firebase + Qdrant over Supabase + pgvector. Spec alignment + speed-to-Phase-2 beats SQL ergonomics.
- **0002** — arq over Celery. Async end-to-end mental model, tiny config surface.

## Tests added
- **Unit:** 4 (`test_health` × 3, `test_me_requires_auth` × 2)
- **Integration:** 0 (Firestore emulator deferred to Phase 1)
- **e2e:** 0 (Playwright deferred to MVP / Phase 3)
- **Coverage target:** baseline established; coverage.xml uploaded as CI artifact.

## Observability artifacts
- structlog request-scoped logging with `request_id` propagation through `X-Request-Id`.
- OTel SDK wired; FastAPI + httpx auto-instrumented; spans flow to Jaeger via OTLP gRPC. Open http://localhost:16686 after `just up`, hit `/health` a few times, see the trace.

---

## Concepts to internalize (interview-framed)

| Concept | Why it matters in an interview |
|---|---|
| Multi-stage Dockerfile + non-root runtime + healthcheck | Production-readiness signals; common rubric item in platform/SRE rounds |
| Pydantic-settings + `lru_cache` for config | Demonstrates env-driven 12-factor config without a global mutable singleton |
| `ContextVar` for request IDs vs threadlocals | Async-safe; threadlocals leak across coroutines — common bug interviewers probe |
| OTel → OTLP → Jaeger | Standards-based; portable to any backend (Honeycomb, Datadog, Tempo) without code change |
| Firebase ID-token verification at the edge | Stateless auth, no session DB; you can articulate when it's the wrong choice (long-lived sessions, revocation latency) |
| ASGI middleware vs FastAPI dependency for auth | We chose dependency (per-route opt-in); middleware would be global. Both are valid; defend the choice. |
| Multi-tenant isolation as a backend invariant | Firestore rules first, app code second — defense in depth. Common system-design topic. |
| Hot-reload via bind mount inside Docker | Shows you've actually used Docker for development, not just deployment |
| pre-commit + ruff + gitleaks | "I don't ship secrets" is table stakes; demonstrate the actual hook |

---

## Gotchas hit / pre-empted

1. **Empty bind-mount creates a directory.** If we'd mounted `./backend/secrets/firebase-sa.json` directly when the file doesn't exist, Docker silently creates an empty directory, breaking the runtime. Solution: keep the secret mount in `docker-compose.override.yml` (gitignored) that the user creates only after downloading the key.
2. **`firebase_admin.initialize_app` is not idempotent.** Calling it twice raises. Hence the `_initialized` flag in `app/core/firebase.py`.
3. **OTel must be configured before app instrumentation.** `configure_tracing()` runs before `instrument_app(app)` in `_build_app`; reversing them silently disables tracing.
4. **`NEXT_PUBLIC_*` env vars are inlined at build time.** Set them before `npm run build`; CI does this with placeholder values.
5. **Next 15 + React 19 + Tailwind 3.** Tailwind 4 alpha exists; we deliberately stayed on 3 for stability. Revisit at Phase 10 deploy.
6. **Windows + Docker hot reload.** Bind mounts work via WSL2; without WSL2 backend they're slow. Confirm `docker run --rm hello-world` succeeds before `just up`.

---

## What you do next (before saying "start phase 1")

1. **Install prerequisites** (one time):
   - Docker Desktop with WSL2 backend enabled (`docker run hello-world` succeeds).
   - Node 20+ (`node -v`).
   - Python 3.11 (`py -3.11 --version`).
   - `just` (`winget install Casey.Just`).
   - `pre-commit` (`pip install pre-commit` then `pre-commit install` in the repo root).

2. **Create the Firebase dev project** (10 min):
   - Console → New project → name it `polaris-dev`.
   - Authentication → Sign-in method → enable **Google**.
   - Project settings → Service accounts → "Generate new private key" → save to `backend/secrets/firebase-sa.json`.
   - Project settings → Your apps → Add a Web app → copy the SDK config into `frontend/.env.local`.
   - Add `FIREBASE_PROJECT_ID=polaris-dev` and `FIREBASE_CREDENTIALS_PATH=/run/secrets/firebase-sa.json` to `backend/.env`.
   - `cp docker-compose.override.yml.example docker-compose.override.yml`.

3. **Bring it up:**
   ```
   just up
   cd frontend && npm install && npm run dev
   ```
   Visit http://localhost:3000 → Sign in → "Call /api/me" → see your UID + email. Open http://localhost:16686 (Jaeger) → find the `GET /api/me` trace.

4. **Run the checks:**
   ```
   just check     # lint + type + test for both stacks
   ```

5. **Commit + push.** Watch CI go green on GitHub.

## Known debt / "what I'd do next" (interview honesty)

- No frontend tests yet — Playwright happy-path enters at MVP (Phase 3).
- No SBOM / image scan in CI yet (Trivy is a one-liner; add at Phase 10 deploy).
- `mypy` strict but a few `firebase_admin` and `google.cloud.*` modules are ignored (their stubs are spotty). Revisit if it hides a real bug.
- Frontend uses `useEffect` for auth subscription on the home page; a proper auth context provider lands in Phase 1.
- Firestore security rules don't exist yet — Phase 1 deliverable.

---

## Exercises (do these to lock the concepts in)

1. **Break the trace propagation on purpose.** Comment out `instrument_app(app)` in `main.py`, hit `/api/me`, see traces disappear in Jaeger. Restore it.
2. **Add a manual span.** In `app/api/me.py`, wrap the body in `with tracer.start_as_current_span("me.fetch")`. Send a request. Find your custom span nested under the auto-generated FastAPI span in Jaeger.
3. **Force gitleaks to catch you.** `echo 'SECRET="sk_live_abc"' > leak.txt && git add leak.txt && git commit -m test`. Watch the pre-commit hook block it. `git restore --staged leak.txt && rm leak.txt`.
4. **Read `app/core/deps.py` and explain** — out loud or to a rubber duck — why `verify_id_token` returns 503 (not 401) when Firebase isn't initialized.
