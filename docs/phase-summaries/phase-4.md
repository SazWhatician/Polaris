# Phase 4 — Syllabus Intelligence

> **Outcome:** Completed Syllabus Intelligence core engine. Users can now upload a course syllabus (either raw text or a processed document), extract a structured recursive hierarchy (Topic Tree) using Groq JSON Mode and a corrective retry loop, and compute a comprehensive "Coverage Map" mapping their study notes against the syllabus topics using hybrid scoring (vector search frequency + LLM grading) with recursive parent rollup scoring.

---

## Files created / modified (grouped)

### Backend — Syllabus stack
| Path | Purpose |
|---|---|
| `app/models/syllabus.py` | `Topic`, `Syllabus`, `CoverageDetail`, `SyllabusCoverage` models |
| `app/services/syllabus_service.py` | Topic tree extraction (retrying invalid JSON); hybrid coverage evaluation; recursive roll-up algorithm |
| `app/api/syllabus.py` | `POST /api/syllabus`, `GET /api/syllabus/{id}`, `DELETE /api/syllabus/{id}`, `POST /api/syllabus/{id}/coverage` |
| `app/main.py` (modified) | Registered `/api/syllabus` endpoints in the core FastAPI router |

### Backend — Tests & Alignment
| Path | Count / Purpose |
|---|---|
| `tests/unit/test_syllabus_service.py` | 7 tests (extraction, validation, retry loop, coverage calculation, golden-syllabus snapshot) |
| `tests/unit/test_syllabus_api.py` | 5 tests (syllabus endpoints CRUD + coverage execution) |
| `tests/unit/test_document_service.py` (modified) | Added strict type annotations; fixed ValueError unpacking bug in `test_delete_removes_blob_and_record` |
| `tests/unit/test_documents_api.py` (modified) | Added strict type annotations; corrected Pydantic validation error by using `"a@x.com"` instead of `"a@x"` |

### Docs
| Path | Purpose |
|---|---|
| `adr/0009-structured-llm-output-retry-strategy.md` | Decision on JSON Mode + Pydantic validation + corrective retry for LLM responses |
| `adr/0010-syllabus-coverage-scoring-rollup.md` | Decision on hybrid leaf scoring + recursive parent roll-up average |
| `phase-summaries/phase-4.md` | This document |

---

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/syllabus` | Bearer | Creates syllabus from text or document_id; returns structured topic tree |
| GET | `/api/syllabus/{id}` | Bearer | Retrieves syllabus structure |
| DELETE | `/api/syllabus/{id}` | Bearer | Deletes syllabus record from DB |
| POST | `/api/syllabus/{id}/coverage` | Bearer | Computes and returns the coverage map of the syllabus against the user's notes |

---

## Concepts to internalize (interview-framed)

| Concept | Why it matters in an interview |
|---|---|
| Corrective Retry for LLM Outputs | Hosted models can drift or fail JSON constraints. Returning a single retry prompt with the raw exception lets the model self-correct, yielding higher reliability. |
| Hybrid Coverage Map | Using Vector DB retrieval counts (quantity) combined with LLM grading (quality) guarantees accurate assessment of student notes. |
| Recursive Rollup Math | Rolling up child leaf scores to parents via a recursive average represents balanced progress across entire course modules. |
| Strict Static Type Alignment | Ensures the codebase complies with strict compilation patterns, eliminating type-safety bugs before runtime. |

---

## Gotchas & Verification

1. **Incorrect email format in auth overrides**: Pydantic's email validation is strict. Any mock email overrides must have a dot-domain (e.g. `a@x.com` instead of `a@x`), otherwise authentication overrides fail validation during API integration testing.
2. **Tuples returned by test fixtures**: Unpacking test fixtures returned by pytest must match the exact fixture definition return signature. In `test_document_service.py`, returning a 4-tuple and unpacking only 3 values causes runtime test failures.
