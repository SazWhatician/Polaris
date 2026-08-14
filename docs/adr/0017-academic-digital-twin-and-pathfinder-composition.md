# ADR 0017: Academic Digital Twin State Management & Pathfinder Composition

- **Status:** Accepted
- **Date:** 2026-08-14
- **Context:** Polaris needed a persistent user model (Academic Digital Twin) to track known vs. missing concepts over time and answer prerequisite readiness queries ("Can I learn X?"), as well as a multi-agent composer (Pathfinder) for career goal planning.

## Decision

1. **State Persistence & Caching:** Store `AcademicTwin` state in Firestore under `users/{uid}/twin/state` with an in-memory LRU cache (`_twin_cache`).
2. **Signal Ingestion:** Support event-driven updates from Chat, OCR, Syllabus, and Chrome extension passive signals (`TwinSignal`). Signal ingestion automatically promotes concepts from `missing` → `weak` → `known` and computes learning velocity over 12 ISO weeks.
3. **Prerequisite Readiness Traversal:** Implement readiness checks via direct traversal of the user's latest Knowledge Graph (`GraphRepository`) matching required prerequisites against `twin.known_concepts`.
4. **Pathfinder Multi-Agent Composition:** Compose Pathfinder Agent output by combining static career roadmaps (`career_roadmaps.json`), user twin state (`TwinService`), and graph prerequisite structures without reimplementing underlying analysis logic.

## Consequences

- Prerequisite verification is deterministic and instant (graph lookup), while reasoning over career suitability remains LLM-enhanced.
- Passive study signals from Phase 11 can seamlessly update twin state without altering the twin model contract.
