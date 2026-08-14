# ADR 0020: On-Device Embedding Parity Envelope

- **Status:** Accepted
- **Date:** 2026-08-14
- **Context:** The Chrome extension cross-tab study sensor calculates text cosine similarity against user topic embeddings locally to filter irrelevant pages without hitting cloud APIs on every page visit.

## Decision

1. **Embedding Model Parity:** Ensure on-device vector representations match the 384-dimensional space of server-side `sentence-transformers/all-MiniLM-L6-v2`.
2. **Daily Snapshot Sync:** Synchronize topic vector snapshots daily from `GET /api/graph/topic-embeddings` into `chrome.storage.local`.
3. **Similarity Threshold Gate:** Enforce a similarity threshold (`cos_sim >= 0.72`) before batching and posting passive study signals (`TwinSignal`) to `POST /api/twin/signals`.

## Consequences

- Zero per-page cloud API calls for non-academic browsing.
- Ensures privacy: irrelevant web browsing content never leaves the browser.
