# 0005. Idempotent OCR via content hash + single-job-per-worker scaling

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
The OCR pipeline can be retriggered for a document under several conditions: arq retries on transient failure, the user clicks "Reprocess" on a failed doc, or — eventually — Phase 3 enqueues re-OCR after a chunking change. Without idempotency, every retrigger re-renders every page and re-runs PaddleOCR even if the underlying bytes are identical. At ~1 s/page on CPU PaddleOCR, that's wasted minutes per click.

We also need to decide how concurrency works inside a worker container. PaddleOCR is CPU-bound; the GIL serializes Python frames, and PaddlePaddle's C extensions release the GIL inside their hot loops but quickly re-acquire it for Python-side post-processing.

## Decision
Two parts:

1. **Idempotency:** the worker computes `sha256(blob_bytes)` at the start of every job. If the document's stored `content_hash` matches the new hash AND `status == OCR_COMPLETE`, the job short-circuits with `{"skipped": true, "reason": "unchanged"}`. The hash is stored on the document at processing start (before OCR runs) so a failed-and-retried job sees the correct hash on its next attempt.

2. **Concurrency:** `arq` `WorkerSettings.max_jobs = 1`. Scale OCR by running more worker *containers*, not by raising the concurrency knob inside one.

## Alternatives Considered
**Idempotency:**
- **No content hash; always re-OCR on retry.** Cheapest to implement; wastes compute on flaky-network retries; slows the UI loop.
- **ETag from GCS (`blob.md5_hash`).** Works, but the MD5 is base64-encoded and GCS sometimes omits it for resumable uploads. SHA-256 of the bytes is one extra read but bulletproof.
- **Per-page caching keyed on page hash.** Best for partial edits to PDFs. Premature for our use case; would require dirty-tracking the source.

**Concurrency:**
- **`max_jobs = 4`** with hopes the C extension releases enough GIL time. In practice, post-processing back in Python burns the GIL; you get ~1.2× the throughput of `max_jobs=1` but lose all isolation: one OOM kills four jobs.
- **One worker per CPU using a `ProcessPoolExecutor`.** Heavier; harder to instrument with OTel; each pool worker re-loads the 500 MB model. Bad memory trade.
- **GPU PaddleOCR.** Free tier doesn't have GPUs; out of scope.

## Consequences
**Positive**
- `Reprocess` after a transient network blip is free (one storage read + one hash).
- arq's automatic retry on `RuntimeError` is safe: a partial second attempt either sees the same hash and skips, or completes the work.
- "Scale workers" is a one-line `docker-compose --scale worker=N` change. Each worker is fully isolated.
- The state machine in `app/services/status_transition.py` enforces "only QUEUED docs are processed" — the worker can't be tricked into re-OCRing in flight.

**Negative / tradeoffs accepted**
- Full SHA-256 over the blob means reading the whole file. For 50 MiB at 200 MB/s that's ~250 ms — fine. If we ever ship 1 GiB files this needs streaming.
- One job per container means underutilized CPU on a multi-core host with a single worker. Documented; mitigated by horizontal scaling.
- Idempotency works only when the OCR engine + render scale produce stable output. If we change `OCR_RENDER_SCALE`, the previous content hash is technically still valid but the OCR output may differ. Mitigation: bump a `OCR_PIPELINE_VERSION` and include it in the hash input when we cross a real cliff. Not needed yet.

**Revisit triggers**
- We start running paid GPU OCR (different cost shape; per-job concurrency may pay).
- We need partial re-OCR (page-level diffing).
- Files routinely exceed 100 MiB (streaming hash).
