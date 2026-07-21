# 0011. State Persistence and Resumability Strategy for LangGraph Agent

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Antigravity, USER

## Context
Phase 5 requires building a stateful, resumable LangGraph agent to classify syllabus topics, rank them by prerequisite/priority order, and generate recommendations.
LangGraph requires a checkpoint saver implementing `BaseCheckpointSaver` to persist graph states, support multi-turn iterations, handle task errors/cancellations, and resume runs from a specific checkpoint.
Since the Polaris project is built on Firebase, we need a custom checkpoint saver backed by **Firestore** to store checkpoints, channel blobs, and pending writes.

Multi-tenant security rules require that a user's checkpoint data is isolated and cannot be accessed by another user.
This means we must map every checkpoint run to a specific `user_id`.

## Decision
We will implement a custom `FirestoreCheckpointSaver` inheriting from LangGraph's `BaseCheckpointSaver`.
- **Tenant Isolation:** We will enforce that the `thread_id` is formatted as `{user_id}:{session_id}`. This allows any repository or api endpoint to parse the `user_id` directly from the `thread_id` without requiring dynamic runtime properties or out-of-band context.
- **Firestore Subcollections:** All checkpoint data will be nested under a subcollection structure of the user document:
  - Checkpoints: `users/{user_id}/checkpoints/{thread_id}_{checkpoint_ns}_{checkpoint_id}`
  - Channel Blobs: `users/{user_id}/checkpoint_blobs/{thread_id}_{checkpoint_ns}_{channel}_{version}`
  - Pending Writes: `users/{user_id}/checkpoint_writes/{thread_id}_{checkpoint_ns}_{checkpoint_id}_{task_id}_{idx}`
- **Serialization:** We will use the `serde` protocol provided by `BaseCheckpointSaver` to serialize/deserialize values to bytes, and encode binary payloads as base64 strings (or direct firestore binary fields) to preserve custom objects and channel states.

## Alternatives Considered
- **InMemorySaver** — Simple, but does not persist state across restarts. If a container crashes or is redeployed on Render, all user sessions are lost.
- **Passing `user_id` via `RunnableConfig.configurable`** — While possible, if third-party libraries or internal LangGraph runner wrappers prune config keys, retrieval could fail. Encoding `user_id` inside the `thread_id` is robust and standard practice in multi-tenant agent flows.

## Consequences
- **Positive:**
  - Full persistency of the learning gap analysis sessions.
  - Multi-tenant data privacy is enforced at the DB query level using standard document paths.
  - No database migration or extra dependencies needed; uses the existing Firebase SDK.
- **Negative / tradeoffs accepted:**
  - Base64 encoding/decoding adds minor CPU overhead compared to native binary storage, but this is negligible for typical state graph sizes.
