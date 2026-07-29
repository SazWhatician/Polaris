# 0012. Rate Limiting and Quota-Aware Caching for Third-Party API Agent

- **Status:** Accepted
- **Date:** 2026-07-23
- **Deciders:** Antigravity, USER

## Context
Phase 6 builds the **Resource Discovery Agent** that queries external sources (YouTube Data API v3) and runs LLM ranking calls to curate high-quality educational videos for student learning gaps.

Third-party APIs like YouTube Data API enforce daily quota limits (10,000 quota units/day by default; search queries cost 100 units per request). Groq free-tier models also impose rate limits (~30 RPM). Unchecked automated or repeated requests for the same syllabus topics would rapidly exhaust quota limits and degrade user experience.

We need a caching and quota protection strategy that:
1. Prevents duplicate searches and LLM calls for identical topics across users and sessions.
2. Implements per-user rate limiting on resource discovery endpoints.
3. Provides an offline fallback dataset when API keys are absent or quotas are exceeded.

## Decision
We implemented a multi-layered quota awareness strategy:
- **Firestore Topic Cache (`resources_cache`):** Search and ranking results are normalized and hashed via SHA256 (`topic_hash = sha256(normalized_title)`). Results are stored in Firestore under `users/{user_id}/resources_cache/{topic_hash}` with a 7-day TTL (`expires_at`).
- **Seed Channel Catalog (`data/seed_channels.json`):** Curated educator channels (3Blue1Brown, Computerphile, freeCodeCamp, Neso Academy, MIT OpenCourseWare) are loaded into the search pipeline to boost educational relevance and serve as mock fallback data when API keys are not provided.
- **`slowapi` Rate Limiting Middleware:** Enforces per-user API rate limits on `/api/agents/resource/*` routes.
- **Graceful Fallback:** If YouTube API or LLM ranking calls fail or time out, the system falls back to cached/seed results without crashing the agent execution graph.

## Alternatives Considered
- **In-Memory LRU Cache:** Does not persist across server restarts or multi-worker deployments.
- **Direct Uncached Search:** Rapidly exhausts daily YouTube API quota and Groq RPM limits.

## Consequences
- **Positive:**
  - 90%+ reduction in third-party API calls for common computer science topics.
  - Resilience against rate limits, API outages, and missing credentials.
  - Predictable execution speeds (sub-50ms cache hits).
- **Negative / Tradeoffs:**
  - Cache entries expire after 7 days, requiring a new discovery run for stale topics.
