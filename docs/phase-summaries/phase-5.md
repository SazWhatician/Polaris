# Phase 5 — Learning Gap Agent (LangGraph + Firestore Checkpointer)

> **Outcome:** Built a fully stateful, multi-node LangGraph agent that analyses a user's syllabus coverage map, classifies every topic as `known` / `weak` / `missing`, computes a prerequisite graph via the Groq LLM, topologically sorts gap topics into a dependency-respecting study order, and generates a rich per-topic recommendation list — all persisted in Firestore and exposed via a REST API that the Next.js frontend polls in real time.

---

## Files created / modified (grouped)

### Backend — Agent core

| Path | Purpose |
|---|---|
| `app/agents/gap_agent.py` | `GapAgentState` TypedDict + five-node LangGraph workflow (`load_syllabus` → `load_coverage` → `assess_gaps` → `rank_topics` → `generate_recommendations`). Contains `sanitize_prerequisites()` cycle-removal helper and Kahn-variant `rank_gaps()` topological sorter. |
| `app/models/gap.py` | `GapRecommendation` and `GapAnalysisResponse` Pydantic schemas shared by agent + API. |
| `app/repositories/checkpoint_repo.py` | Custom `FirestoreCheckpointSaver(BaseCheckpointSaver)` — implements `put`, `aget_tuple`, `alist`, `aput`, `aput_writes`, and `adelete_thread`. Encodes binary channel blobs as base64 strings. Thread IDs follow the `{user_id}:{session_id}` convention enforced by ADR-0011. |

### Backend — API

| Path | Purpose |
|---|---|
| `app/api/agents.py` | `POST /api/agents/gap/run` — accepts `syllabus_id`, spawns `run_gap_agent_task` as a `BackgroundTask`, returns `202 Accepted` with `thread_id`. `GET /api/agents/gap/runs/{thread_id}` — reads LangGraph snapshot; returns `202` while nodes remain, `200` with full `GapAnalysisResponse` on completion. `PUT /api/agents/gap/runs/{thread_id}` — writes reordered recommendations back via `aupdate_state`. |
| `app/main.py` (modified) | Registered `agents.router` into the FastAPI app. |

### Backend — Tests

| Path | Count / Purpose |
|---|---|
| `tests/unit/test_gap_agent.py` | 3 tests — `assess_gaps` classification thresholds, `rank_topics` prerequisite ordering, `generate_recommendations` output shape |
| `tests/unit/test_agents_api.py` | 6 tests — trigger run (happy path), trigger with invalid syllabus (404), poll while running (202), poll complete (200), poll unknown thread (403), update recommendations (200) |
| `tests/unit/test_checkpoint_repo.py` | 1 test (mocked Firestore async round-trip) — `aput` + `aget_tuple` serialization fidelity |

### Frontend

| Path | Purpose |
|---|---|
| `lib/api/agents.ts` | TypeScript types (`GapRecommendation`, `GapAnalysisResponse`, `GapRunResponse`) and three fetch helpers: `triggerGapAnalysis`, `getGapAnalysisStatus`, `updateGapRecommendations` |
| `app/gaps/page.tsx` (modified) | Wires up the Run Agent button → `triggerGapAnalysis` → sets `agentStatus = "running"` → background `setInterval(poll, 3000)` → on completion renders ordered recommendation cards with drag-to-reorder and per-step check-off |

### Docs

| Path | Purpose |
|---|---|
| `adr/0011-state-persistence-and-resumability.md` | Decision: custom `FirestoreCheckpointSaver` over `InMemorySaver`; `thread_id = {user_id}:{session_id}` convention; base64 blob encoding |
| `phase-summaries/phase-5.md` | This document |

---

## Endpoints

| Method | Path | Auth | Status codes | Notes |
|---|---|---|---|---|
| POST | `/api/agents/gap/run` | Bearer | 202 / 404 / 503 | Spawns background task; returns immediately with `thread_id` |
| GET | `/api/agents/gap/runs/{thread_id}` | Bearer | 200 / 202 / 403 / 404 / 500 | 202 while nodes remain; 200 on completion; 403 if `uid` mismatch |
| PUT | `/api/agents/gap/runs/{thread_id}` | Bearer | 200 / 403 / 404 | Overwrites `recommendations` list in Firestore checkpoint |

---

## Agent graph (LangGraph node DAG)

```
START
  │
  ▼
load_syllabus         — reads Syllabus + Topic tree from Firestore
  │
  ▼
load_coverage         — reads CoverageMap from Firestore (built by Phase 4)
  │
  ▼
assess_gaps           — pure Python: score ≥ 70 → known | 30-70 → weak | < 30 → missing
  │
  ▼
rank_topics           — asks Groq LLM for prerequisite graph (JSON mode);
  │                    sanitizes cycles; topological sort with influence tie-break
  ▼
generate_recommendations — asks Groq LLM for per-gap recommendation objects (JSON mode);
  │                        falls back gracefully if LLM call fails
  ▼
END
```

---

## State schema (`GapAgentState`)

| Field | Type | Description |
|---|---|---|
| `user_id` | `str` | Firebase UID (read-only after init) |
| `syllabus_id` | `str` | Syllabus PK (read-only after init) |
| `raw_syllabus` | `dict \| None` | Full topic tree from Firestore |
| `coverage_map` | `dict \| None` | Per-topic coverage scores from Phase 4 |
| `gaps` | `dict[str, str]` | `topic_id → "known" \| "weak" \| "missing"` |
| `prerequisites` | `dict[str, list[str]]` | LLM-derived prerequisite edges, cycle-cleaned |
| `recommendations` | `list[dict]` | Final ordered study recommendations |
| `retry_count` | `int` | Reserved for future retry node |
| `error` | `str \| None` | Set by any node that encounters a fatal error |

---

## Concepts to internalize (interview-framed)

| Concept | Why it matters in an interview |
|---|---|
| **LangGraph StateGraph** | LangGraph models multi-step agent logic as a directed graph of async Python nodes sharing a single typed state dict. Nodes return partial state updates; LangGraph merges them. This removes boilerplate state-passing code and makes long-running agent flows inspectable. |
| **Custom BaseCheckpointSaver** | LangGraph's persistence contract (`put`, `aget_tuple`, `aput_writes`, `alist`) decouples the graph from any specific DB. Implementing it for Firestore means state survives pod restarts, and individual checkpoints (one per node completion) are inspectable for debugging. |
| **Thread ID as composite key** | Encoding `{user_id}:{session_id}` inside the thread ID provides tenant isolation in a single Firestore collection without requiring a separate lookup — the API can split on `:` and immediately enforce ownership. |
| **Topological sort with prerequisite graph** | `rank_gaps()` implements Kahn's algorithm: repeatedly pluck topics with no remaining in-dependency, breaking ties by influence (number of downstream gaps unlocked). Cycle detection uses mutual-edge removal before sorting. This is a standard dependency resolution pattern. |
| **Background tasks + polling** | `POST /run` returns `202 Accepted` immediately (non-blocking). The frontend polls `GET /runs/{thread_id}` every 3 s; the backend checks `state_snapshot.next` — non-empty means still running, empty means complete. This keeps the HTTP tier stateless while the agent runs asynchronously. |
| **JSON mode + graceful fallback** | Both LLM calls in the agent (`PREREQ_PROMPT`, `RECOMMENDATIONS_PROMPT`) request JSON mode from Groq and parse with `json.loads`. Any `Exception` is caught and the node continues with empty/stub data rather than crashing the whole graph — important for production reliability. |

---

## Gotchas & Verification

1. **`langchain-core` version pinning**: `langchain-text-splitters` pulled in `langchain-core>=1.2.31`, which broke `langgraph 0.3.34` (requires `<0.4`). Fix: `pip install "langchain-text-splitters<0.4.0"` to stay on the `0.3.x` compatible branch.
2. **`202` status from GET is not an error**: The polling endpoint raises `HTTPException(status_code=202)` while the agent is still running. The frontend must check for `detail == "Gap analysis is still running"` before treating it as an error — standard `4xx/5xx` error handling would break polling.
3. **Thread access control**: The GET and PUT endpoints split `thread_id` on `:` and compare `parts[0]` against `user.uid`. Any mismatch returns `403 Forbidden` — user A can never read or write user B's agent run.
4. **`aupdate_state` requires `as_node`**: When saving reordered recommendations back via PUT, `graph.aupdate_state(config, new_values, as_node="generate_recommendations")` must name the last node so LangGraph correctly advances the checkpoint metadata. Omitting `as_node` leaves the graph in an ambiguous state.
5. **Full test suite**: After installing `langchain-text-splitters<0.4.0`, the backend runs **93 passed, 2 skipped** (skipped = `pypdfium2` not installed locally, used only in integration PDF tests).
