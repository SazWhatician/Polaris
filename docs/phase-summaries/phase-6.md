# Phase 6 — Resource Discovery Agent (LangGraph + YouTube API + Firestore Cache)

> **Outcome:** Built an autonomous **Resource Discovery Agent** that automatically fetches, ranks, enriches, and caches top educational study resources (tutorials, lectures, and visual guides) for weak or missing syllabus topics. Incorporates a multi-node LangGraph workflow, Firestore `resources_cache` with a 7-day TTL, seed educational channel curation (`data/seed_channels.json`), and rate-limited API endpoints.

---

## Files created / modified (grouped)

### Backend — Agent & Service Core

| Path | Purpose |
|---|---|
| `app/models/resource.py` | `ResourceItem`, `ResourceDiscoveryRequest`, `ResourceDiscoveryResponse`, and `CachedTopicResources` Pydantic schemas. |
| `app/data/seed_channels.json` | Dataset of trusted educational channels (3Blue1Brown, Computerphile, freeCodeCamp, Neso Academy, MIT OCW). |
| `app/prompts/resource_ranker/v1.md` | Versioned prompt template for educational quality ranking and generating "why recommended" blurbs. |
| `app/services/youtube_service.py` | YouTube Data API v3 client with ISO 8601 duration parser and mock seed fallback generator. |
| `app/repositories/resource_cache_repo.py` | `ResourceCacheRepository` for saving/retrieving normalized SHA256 topic-hashed resource entries in Firestore with TTL. |
| `app/agents/resource_agent.py` | 5-node LangGraph state machine (`check_cache` → `search_youtube` → `dedupe_and_filter` → `rank_resources` → `save_cache`). |

### Backend — API & Routes

| Path | Purpose |
|---|---|
| `app/api/resource_agent.py` | `POST /api/agents/resource/run` (triggers background discovery), `GET /api/agents/resource/runs/{thread_id}` (polls status), and `GET /api/agents/resource/topic/{topic_title}` (direct cache lookup). |
| `app/main.py` (modified) | Registered `resource_agent.router`. |

### Backend — Tests

| Path | Count / Purpose |
|---|---|
| `tests/unit/test_youtube_service.py` | 2 tests — ISO 8601 duration parsing and YouTube service mock fallback functionality. |
| `tests/unit/test_resource_agent.py` | 1 test — LangGraph node execution (`check_cache` miss → search → LLM rank → `save_cache`). |

### Frontend

| Path | Purpose |
|---|---|
| `lib/api/resources.ts` | TypeScript API client with interfaces (`ResourceItem`, `ResourceDiscoveryResponse`) and trigger/poll helpers. |
| `app/resources/page.tsx` | Interactive resource discovery UI with topic search bar, progress indicator, video thumbnail cards, rank badges, and "Why Study This" LLM blurbs. |

### Docs

| Path | Purpose |
|---|---|
| `adr/0012-rate-limiting-and-quota-aware-caching.md` | ADR detailing quota protection via 7-day Firestore TTL cache and seed channel fallback. |
| `phase-summaries/phase-6.md` | This phase summary. |

---

## Agent Graph Workflow (LangGraph Node DAG)

```
START
  │
  ▼
check_cache         — checks Firestore resources_cache by topic_hash
  │
  ├── (Cache HIT) ──────────────────────────┐
  │                                         │
  ▼ (Cache MISS)                            │
search_youtube      — queries YouTube API / seed channel catalog
  │                                         │
  ▼                                         │
dedupe_and_filter   — filters duplicates & short non-instructive clips
  │                                         │
  ▼                                         │
rank_resources      — LLM ranks candidates (0.0 - 1.0) & generates rationales
  │                                         │
  ▼                                         │
save_cache          — saves entry in Firestore with 7-day TTL
  │                                         │
  └───► END ◄───────────────────────────────┘
```

---

## Endpoints Added

| Method | Path | Auth | Status Codes | Description |
|---|---|---|---|---|
| POST | `/api/agents/resource/run` | Bearer | 202 | Trigger resource discovery run for topic |
| GET | `/api/agents/resource/runs/{thread_id}` | Bearer | 200 / 202 / 403 / 404 | Poll thread status & retrieved resources |
| GET | `/api/agents/resource/topic/{topic_title}` | Bearer | 200 / 404 | Direct lookup of cached resources by topic |

---

## Verification
- Unit tests: `pytest backend/tests/unit/test_youtube_service.py backend/tests/unit/test_resource_agent.py`
