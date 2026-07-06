# 0003. Signed URLs for uploads, never proxy file bytes

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
The user uploads PDFs and images that can be up to 50 MiB. Two shapes for the upload path:

1. **Proxy upload** — browser POSTs file bytes to FastAPI → FastAPI streams to Firebase Storage.
2. **Signed URL** — backend issues a short-lived v4 signed PUT URL → browser PUTs the file directly to GCS → browser tells backend "done" → backend verifies blob existence.

## Decision
Use **v4 signed PUT URLs** with a 15-minute TTL. Backend never sees the file bytes.

## Alternatives Considered
- **Proxy upload**
  - Pros: simpler client code; backend can do MIME sniffing / virus scan inline; no GCS CORS to configure.
  - Cons: API hot path holds a connection open for the full upload (50 MiB × N users = process saturation); doubles bandwidth cost; multiplies latency; complicates async semantics (uvicorn workers tied up).

## Consequences
**Positive**
- API hot path stays milliseconds-cheap; one process can issue thousands of signed URLs per second.
- GCS handles upload reliability (resumable upload, retries) better than we ever could.
- Pricing footprint: egress is only the user → GCS leg, not user → API → GCS.
- Pattern transfers cleanly to S3 / R2 / Azure Blob if we ever swap providers.

**Negative / tradeoffs accepted**
- Need a **finalize** endpoint to verify blob existence and capture metadata; introduces a two-step state (`requested` → `uploaded`). Mitigated with an explicit `DocumentStatus` enum and the `finalize_upload` service method.
- **CORS on the bucket** must be configured manually with `gsutil cors set cors.json gs://<bucket>` — documented in the Phase 1 summary and runbook.
- MIME/size validation happens at three layers (frontend pre-check, backend `_validate_upload`, Storage security rules). Three walls is the right number for defense in depth; we document the source of truth (the backend) and treat the others as belts.
- Signed URLs leak GCS bucket names and the object path — fine for our threat model; sensitive in some enterprise contexts.

**Revisit triggers**
- If we need on-upload virus scanning (would need an event-driven step on GCS finalize anyway, not a proxy).
- If GCS pricing changes meaningfully relative to compute pricing.
