# ADR 0019: In-Page Agent LLM Key Boundary (Proxy vs. Client)

- **Status:** Accepted
- **Date:** 2026-08-14
- **Context:** PolarAssist copilot requires an LLM for intent routing and GUI task planning. Exposing raw Groq/Gemini API keys to the browser client creates security risks and rate-limit vulnerabilities.

## Decision

1. **Server-Side Proxy (`POST /api/agent-llm/plan`):** Proxy copilot planning calls through a protected FastAPI endpoint on the Polaris backend rather than embedding LLM keys in client JS bundles.
2. **Client Authentication:** Authenticate copilot requests via standard Firebase ID token (`Bearer` header).
3. **Fallback Client Adapter:** Provide `POLARIS_CAPABILITIES` heuristic auto-routing on the frontend as an instant sub-50ms fallback when offline or during rate limits.

## Consequences

- Prevents API key leakage and enforces server-side rate limits and logging.
- Adds minimal latency (~50ms) for copilot planning.
