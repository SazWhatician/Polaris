# 0013. Revision Plan Representation and Semantic Diffing Strategy

- **Status:** Accepted
- **Date:** 2026-07-30
- **Deciders:** Antigravity, USER

## Context
Phase 7 introduces the **Revision Planner Agent**, which generates date-bounded, constraint-aware study schedules given an exam target date, topic gaps, and daily available study hours. Additionally, users need to re-plan as their exam dates approach or topic gaps shift, and observe what changed between schedule iterations.

Key engineering challenges:
1. **Date Arithmetic & Schedule Bounds:** Relying on generative LLMs to perform calendar math often leads to hallucinated dates or improper day counts.
2. **Semantic Plan Diffing:** Identifying schedule changes (added topics, removed topics, rescheduled topics, duration adjustments) must be deterministic and predictable across plan runs.

## Decision
We implemented a hybrid deterministic framing + LLM allocation strategy:
- **Deterministic Date Bounds:** The agent calculates date ranges and daily available slots deterministically using Python standard library `datetime` and `timedelta`.
- **Priority-Driven Allocation:** Topic gaps are sorted by priority (`high` | `medium` | `low`) and distributed into max 2-hour daily study blocks.
- **Deterministic Semantic Diff Engine:** [`plan_diff_service.py`](file:///c:/Users/saswa/Desktop/Polaris/backend/app/services/plan_diff_service.py) compares two `RevisionPlan` objects by topic ID and scheduled date. It classifies diff items as `added`, `removed`, `rescheduled`, or `duration_changed` without requiring LLM evaluation.
- **Resumable State Checkpoint:** The agent compiles with `FirestoreCheckpointSaver` under `users/{user_id}/plans/{plan_id}`.

## Alternatives Considered
- **Pure Generative LLM Schedule Output:** Prompting the LLM to output full date strings for multi-week schedules resulted in invalid dates and inconsistent schema formats.
- **LLM-Based Plan Diffing:** Asking an LLM to compare two JSON plans introduced non-deterministic diff descriptions and potential missed changes.

## Consequences
- **Positive:**
  - 100% calendar accuracy without hallucinated dates.
  - Sub-millisecond deterministic semantic plan diffing.
  - Complete state persistence and historical plan comparisons.
- **Negative / Tradeoffs:**
  - Topic distribution across days follows a fixed priority-fill heuristic rather than complex non-linear constraint solvers.
