# Architecture

> Living document. Updated at the end of every phase. As of Phase 0: only the auth + observability spine exists.

## System (current — Phase 3 MVP)

```mermaid
flowchart LR
    user([User browser])
    fe[Next.js]
    api[FastAPI]
    worker[arq worker · PaddleOCR + embed]
    redis[(Redis)]
    jaeger[(Jaeger)]
    qdrant[(Qdrant)]
    groq[Groq LLM]
    fbauth[(Firebase Auth)]
    fs[(Firestore)]
    storage[(Firebase Storage)]

    user --> fbauth
    user --> fe
    user -->|PUT via signed URL| storage
    fe -->|Bearer ID token| api
    api --> fbauth
    api --> fs
    api -->|enqueue OCR| redis
    api --> jaeger
    api -->|search per-user| qdrant
    api -->|chat completion stream| groq
    api -->|SSE answer + citations| fe
    worker -->|dequeue| redis
    worker -->|download blob| storage
    worker -->|write pages| fs
    worker -->|upsert chunks| qdrant
    worker --> jaeger
```

## System (target — by Phase 10)

```mermaid
flowchart LR
    user([User browser])
    fe[Next.js · Vercel]
    api[FastAPI · Render]
    worker[arq worker]
    redis[(Redis)]
    fbauth[(Firebase Auth)]
    fs[(Firestore)]
    storage[(Firebase Storage)]
    qdrant[(Qdrant Cloud)]
    groq[Groq LLM]
    nvidia[NVIDIA NIM embeddings]
    langsmith[(LangSmith traces)]
    sentry[(Sentry errors)]

    user --> fbauth
    user --> fe
    fe --> api
    fe --> storage
    api --> fbauth
    api --> fs
    api --> qdrant
    api --> groq
    api --> nvidia
    api --> langsmith
    api --> sentry
    api --> redis
    worker --> redis
    worker --> fs
    worker --> storage
    worker --> qdrant
    worker --> nvidia
```

## Auth round-trip (Phase 0)

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant FE as Next.js
    participant FBAuth as Firebase Auth
    participant API as FastAPI
    User->>FE: Click "Sign in with Google"
    FE->>FBAuth: signInWithPopup(GoogleProvider)
    FBAuth-->>FE: ID token
    User->>FE: Click "Call /api/me"
    FE->>API: GET /api/me · Authorization: Bearer <token>
    API->>FBAuth: verify_id_token(token)
    FBAuth-->>API: { uid, email, name, ... }
    API-->>FE: 200 AuthenticatedUser
    FE-->>User: render JSON
```

## Layer boundaries (enforced by code review)

```
api/        -- HTTP concerns only: parse, validate, call service, format response
services/   -- business logic: orchestrates repositories + external clients
repositories/  -- single source of truth for Firestore / Qdrant access
agents/     -- LangGraph state machines (Phase 5+)
prompts/    -- versioned .md prompts; loaded by name+version (Phase 3+)
workers/    -- arq task definitions (Phase 2+)
models/     -- Pydantic schemas: domain + request/response
core/       -- cross-cutting: config, logging, otel, firebase init, deps
```

Rule of thumb: **business logic never lives in `api/`**, **data access never lives in `services/`**. Reviewers should reject PRs that violate these.

## Observability

- **Structured JSON logs** via structlog. Every log line carries `request_id` (from `X-Request-Id` header or minted UUID).
- **Distributed traces** via OpenTelemetry → Jaeger. FastAPI and httpx are auto-instrumented. Manual spans wrap business operations (`with tracer.start_as_current_span("ocr.process_page")`).
- **LangSmith** (Phase 3+) captures full LLM traces — every retrieval, prompt assembly, and Groq call is replayable.
- **Sentry** (Phase 10) for production errors.

## Multi-tenant isolation

Every Firestore document is keyed under `users/{uid}/...`. Every Qdrant query passes a `payload filter: user_id == uid`. Security rules enforce this at the DB layer; backend code is the second wall.
