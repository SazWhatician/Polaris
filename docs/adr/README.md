# Architecture Decision Records

Short, dated, defensible records of every non-obvious technical choice in Polaris.

Format follows [Michael Nygard's ADR template](https://github.com/joelparkerhenderson/architecture-decision-record). New ADRs use [0000-template.md](0000-template.md).

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-firebase-qdrant-vs-supabase-pgvector.md) | Firebase + Qdrant over Supabase + pgvector | Accepted | 2026-06-28 |
| [0002](0002-arq-over-celery-for-async-workers.md) | arq over Celery / RQ for async workers | Accepted | 2026-06-28 |
| [0003](0003-signed-urls-vs-proxy-uploads.md) | Signed URLs for uploads, never proxy file bytes | Accepted | 2026-06-28 |
| [0004](0004-rules-testing-strategy.md) | Test Firestore + Storage rules against emulator suite in CI | Accepted | 2026-06-28 |
| [0005](0005-idempotent-ocr-via-content-hash.md) | Idempotent OCR via content hash + 1-job-per-worker scaling | Accepted | 2026-06-28 |
| [0006](0006-pypdfium2-over-pdf2image-pymupdf.md) | pypdfium2 for PDF rendering (over pdf2image + PyMuPDF) | Accepted | 2026-06-28 |
| [0007](0007-eval-methodology.md) | Eval methodology — golden set + LLM-as-judge + regression threshold | Accepted | 2026-06-28 |
| [0008](0008-chunking-strategy.md) | Chunking strategy: RecursiveCharacterTextSplitter at 800/100 | Provisional | 2026-06-28 |
| [0009](0009-structured-llm-output-retry-strategy.md) | Structured LLM output & retry strategy | Accepted | 2026-07-06 |
| [0011](0011-state-persistence-and-resumability.md) | State persistence & resumability strategy | Accepted | 2026-07-15 |
| [0012](0012-rate-limiting-and-quota-aware-caching.md) | Rate limiting and quota-aware caching for third-party API agent | Accepted | 2026-07-23 |
| [0013](0013-revision-plan-representation-and-diffing.md) | Revision plan representation and semantic diffing strategy | Accepted | 2026-07-30 |
| [0017](0017-academic-digital-twin-and-pathfinder-composition.md) | Academic Digital Twin state management & Pathfinder composition | Accepted | 2026-08-14 |
| [0018](0018-production-deployment-topology.md) | Production deployment topology & CI/CD strategy | Accepted | 2026-08-14 |
| [0019](0019-in-page-agent-llm-key-boundary.md) | In-page agent LLM key boundary (proxy vs. client) | Accepted | 2026-08-14 |
| [0020](0020-on-device-embedding-parity.md) | On-device embedding parity envelope | Accepted | 2026-08-14 |
| [0021](0021-passive-signal-schema-and-privacy-discipline.md) | Passive signal schema & privacy discipline | Accepted | 2026-08-14 |

