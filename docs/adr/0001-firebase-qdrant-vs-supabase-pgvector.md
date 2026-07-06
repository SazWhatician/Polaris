# 0001. Firebase + Qdrant over Supabase + pgvector

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
Polaris needs: auth, a metadata store, a file store, and a vector store. The two clean shapes are:

1. **Firebase (Auth + Firestore + Storage) + Qdrant** — what the build plan calls for.
2. **Supabase (Auth + Postgres) + pgvector + Supabase Storage** — single backend with SQL semantics and a vector type co-located with relational data.

Both are free-tier compatible. The choice affects every phase from 1 onward.

## Decision
Use **Firebase Auth + Firestore + Firebase Storage + Qdrant Cloud (free tier)**.

## Alternatives Considered
- **Supabase + pgvector**
  - Pros: single DB, SQL ergonomics, vector + relational joins, open source, generous free tier.
  - Cons: requires running auth + DB + storage + vector behaviors through one product whose abstractions are still evolving; row-level security learning curve; deviates from the project's stated stack.
- **Self-hosted Postgres + pgvector + Auth.js**
  - Pros: maximum control, fully OSS.
  - Cons: I'd spend Phase 0 on auth plumbing instead of moving to OCR. Operational cost outweighs learning return for a portfolio.

## Consequences
**Positive**
- Firebase Auth + ID-token verification is a 50-line backend dependency; we move fast in Phase 0/1.
- Firestore's document model maps cleanly to per-user document hierarchies (`users/{uid}/documents/{docId}/pages/{pageId}`).
- Qdrant payload filtering gives per-user tenant scoping with one extra filter, cleanly testable.
- Spec-aligned, so the README narrative is consistent.

**Negative / tradeoffs accepted**
- Firestore is not SQL — joining across collections is on us (denormalize where needed; query patterns must be designed up front).
- Two systems to operate (Firebase + Qdrant) instead of one.
- Firestore vendor lock-in is real; mitigated by keeping all access behind `repositories/*` so a future port is a per-method swap, not a rewrite.
- Qdrant Cloud free tier is 1 GB — fine for personal use but caps growth.

**Revisit triggers**
- If we ever need cross-collection joins beyond what denormalization handles.
- If Qdrant Cloud free tier becomes a blocker — swap to self-hosted Qdrant via docker-compose.
