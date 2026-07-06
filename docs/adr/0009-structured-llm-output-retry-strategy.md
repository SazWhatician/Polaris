# 0009. Structured LLM Output Retry Strategy

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Assistant, USER

## Context
In Phase 4 (Syllabus Intelligence), we need to extract a structured hierarchical topic tree from syllabus text, and evaluate coverage of individual topics. Both tasks require the LLM (Groq) to output structured data (valid JSON conforming to a Pydantic model).

However, LLMs can output invalid JSON, violate the requested schema (e.g. missing fields), or return extra markdown conversational wraps (e.g. ` ```json ` tags) despite system instructions. We need a reliable strategy to validate output structure and recover when validation fails, without failing the user request immediately.

## Decision
We will employ a three-tier approach:
1. **Groq JSON Mode**: We pass `response_format={"type": "json_object"}` in the API request, ensuring that the model output is technically a valid JSON string.
2. **Pydantic Model Validation**: We run `model_validate_json(...)` on the JSON output to verify it adheres to our domain-specific models (`LLMTopicTree`, `LLMCoverageGrade`).
3. **Corrective Retry Loop**: If validation fails (either parsing error or validation schema error), we trigger a single corrective retry. The retry prompt feeds the original prompt, the failed invalid output, and the validation error message back to the LLM, instructing it to correct its response.
4. **Resilient Fallback**: If the retry still fails, we fall back to a safe default object (e.g. a single-node syllabus tree or a mid-level partial coverage rating) rather than crashing the API request, logging the event as a warning/error.

## Alternatives Considered
- **Instructor / Marvin libraries** — Adds heavy dependencies and makes customization of the retry prompt harder. We prefer vanilla Pydantic + custom retry prompts.
- **Strict Grammar / Outlines** — Outlines or Guidance can force JSON schema output, but they require complex local inference or model parameters not supported by the hosted Groq API.
- **Fail-Fast** — Throwing a `500 Internal Server Error` on schema failure is unacceptable for a premium UX. Corrective retry + fallback provides a self-healing application.

## Consequences
- **Positive**:
  - Technical JSON validity is guaranteed by the API hosting provider.
  - High resilience against parsing errors and transient LLM drift.
  - Clear error feedback included in the corrective prompts.
  - Fail-safe fallbacks keep the application responsive.
- **Negative / tradeoffs accepted**:
  - Schema mismatch failures result in a second LLM API call, which increases request latency for that transaction.
  - Fallbacks result in degraded, though functional, outputs for the user.
