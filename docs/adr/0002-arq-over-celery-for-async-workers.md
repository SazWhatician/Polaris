# 0002. arq over Celery / RQ for async workers

- **Status:** Accepted (decision recorded in Phase 0; first used in Phase 2)
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
Phase 2 onward we need a task queue to run PaddleOCR (heavy, blocking, ~seconds per page) off the request thread. The mainstream options:

1. **Celery** with Redis or RabbitMQ broker.
2. **RQ** (Redis Queue).
3. **arq** (asyncio-native Redis queue).

Polaris is async end-to-end (FastAPI handlers, httpx, embeddings called via threadpool). The worker should also be async-friendly so the same patterns and instrumentation apply.

## Decision
Use **arq** with Redis as the broker.

## Alternatives Considered
- **Celery** — most mature, biggest community. Cons: sync-first, async support is bolted on, complex configuration surface (eta vs countdown vs beat vs canvas), heavy for our needs. The portfolio cost is "I added Celery and a beat scheduler I don't use".
- **RQ** — minimal, easy. Cons: sync-only worker model. Mixing sync workers with our async stack means more context-switching cost and a different mental model.

## Consequences
**Positive**
- One async mental model end-to-end. The same `await`/structured-logging/OTel patterns apply in workers.
- Tiny config surface (`WorkerSettings` class). The whole queue setup fits on one screen.
- Built-in retry policy with exponential backoff + dead-letter behavior.

**Negative / tradeoffs accepted**
- Smaller ecosystem than Celery. No equivalent of Celery's task chains/groups out of the box — we'll compose with explicit code.
- If we ever need cron-style scheduling, arq has a basic cron facility but it's not Celery Beat.
- Less SEO/StackOverflow material — interview prompts asking specifically about Celery are answered with "I picked arq, here's why" (which is a fine answer).

**Revisit triggers**
- If we hit a workload that genuinely needs Celery Canvas (chord/group/chain) and the wrapping code becomes a maintenance burden.
