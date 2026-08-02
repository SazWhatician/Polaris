# ADR 0016 — Multi-LLM Provider Failover Router & Normalized API Interface

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** Core Architecture / GenAI Team

## Context & Problem Statement

Polaris relies on large language models for RAG chat responses, syllabus topic tree extraction, learning gap analysis, and knowledge graph concept extraction. Relying on a single LLM vendor endpoint creates vulnerability to **429 RateLimitErrors**, API key quota exhaustion, or vendor service downtime.

We needed a resilient **Multi-LLM Provider Router** capable of transparently attempting completions across a chain of model providers (Groq, Google Gemini, OpenAI, Anthropic, Ollama) while maintaining a uniform async streaming and Pydantic structured interface.

## Decision Drivers

1. **High Availability & Fault Tolerance:** Seamless failover on 429 quota exhaustion or HTTP 5xx errors.
2. **Normalized Output Layer:** Unified async iterator interface for streaming tokens and Pydantic schema validation across disparate vendor APIs.
3. **Task-Based Routing Tiers:** Sub-second latency for interactive chat (Groq/Llama-3), massive context window for long documents (Google Gemini), and reliable cloud fallback.

## Decision Outcome

Created **`LLMRouter`** backed by provider adapters (`GroqProvider`, `GeminiProvider`, `OpenAIProvider`) implementing `BaseLLMProvider`.

### Positive Consequences
- **Zero Interrupted User Sessions:** Rate limits on primary key pools fail over silently to secondary models.
- **Vendor Decoupling:** Agents invoke `router.complete()` or `router.stream_completion()` without vendor lock-in.

### Negative Consequences / Mitigations
- **Output Variance Across Models:** Different model families may format prompts slightly differently.
  - *Mitigation:* Strict JSON schema validation and retry logic in `structured_complete`.
