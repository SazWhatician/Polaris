# Phase 11 — Ambient Study Layer (PolarAssist Monorepo Integration)

- **Status:** Complete
- **Date:** 2026-08-14
- **Primary Deliverables:** `backend/app/api/agent_llm.py`, `backend/app/api/graph_embeddings.py`, `frontend/lib/page-agent/config.ts`, `frontend/components/agent-copilot.tsx`, `packages/extension/src/lib/study-sensor.ts`, `packages/extension/src/lib/topic-snapshot.ts`, ADR 0019, ADR 0020, ADR 0021.

## Overview

Phase 11 integrates the **PolarAssist AI Agent Framework** into Polaris:
1. **In-Page Copilot (`AgentCopilot`):** Floating UI action button and drawer overlay enabling natural-language command execution across Polaris pages (`/gaps`, `/twin`, `/pathfinder`, `/graph`, `/plan`). Routes copilot planning calls through backend proxy `POST /api/agent-llm/plan`.
2. **Cross-Tab Study Sensor:** Adapted PolarAssist Chrome Extension with on-device topic embedding snapshot sync (`GET /api/graph/topic-embeddings`) and privacy-preserving study signal reporting (`POST /api/twin/signals`).

## Key Deliverables

| File | Purpose |
|---|---|
| [`backend/app/api/agent_llm.py`](file:///c:/Users/saswa/Desktop/Polaris/backend/app/api/agent_llm.py) | Server-side proxy for PolarAssist copilot planning requests. |
| [`backend/app/api/graph_embeddings.py`](file:///c:/Users/saswa/Desktop/Polaris/backend/app/api/graph_embeddings.py) | Topic vector snapshot endpoint for Chrome Extension caching. |
| [`frontend/lib/page-agent/config.ts`](file:///c:/Users/saswa/Desktop/Polaris/frontend/lib/page-agent/config.ts) | Capability registry mapping user intentions to Polaris routes and DOM action targets. |
| [`frontend/components/agent-copilot.tsx`](file:///c:/Users/saswa/Desktop/Polaris/frontend/components/agent-copilot.tsx) | Floating action trigger button + interactive drawer panel UI component. |
| [`packages/extension/src/lib/study-sensor.ts`](file:///c:/Users/saswa/Desktop/Page-Agent/PolarAssist/packages/extension/src/lib/study-sensor.ts) | Cosine similarity calculation and signal transmission to Polaris twin. |
| [`packages/extension/src/lib/topic-snapshot.ts`](file:///c:/Users/saswa/Desktop/Page-Agent/PolarAssist/packages/extension/src/lib/topic-snapshot.ts) | Chrome Extension topic vector snapshot synchronization module. |
| [`docs/adr/0019-in-page-agent-llm-key-boundary.md`](file:///c:/Users/saswa/Desktop/Polaris/docs/adr/0019-in-page-agent-llm-key-boundary.md) | ADR for in-page agent LLM key security boundary. |
| [`docs/adr/0020-on-device-embedding-parity.md`](file:///c:/Users/saswa/Desktop/Polaris/docs/adr/0020-on-device-embedding-parity.md) | ADR for on-device embedding similarity thresholding. |
| [`docs/adr/0021-passive-signal-schema-and-privacy-discipline.md`](file:///c:/Users/saswa/Desktop/Polaris/docs/adr/0021-passive-signal-schema-and-privacy-discipline.md) | ADR for anonymized study signal schema and user privacy discipline. |
