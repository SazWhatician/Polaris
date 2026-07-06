"""Pure retrieval metrics. No deps on httpx / API."""
from __future__ import annotations

import re

from evals.runners.schema import ExpectedPassage, RetrievalMetrics, RetrievedHit


def _is_hit(hit: RetrievedHit, expected: list[ExpectedPassage]) -> bool:
    for exp in expected:
        if re.search(exp.document_filename_pattern, hit.document_filename, re.IGNORECASE):
            if hit.page_number in exp.page_numbers:
                return True
    return False


def compute(
    hits: list[RetrievedHit], expected: list[ExpectedPassage], *, top_k: int
) -> RetrievalMetrics:
    """Compute precision@k, recall@k, MRR for one query."""
    top = hits[:top_k]
    hit_flags = [_is_hit(h, expected) for h in top]
    hit_count = sum(hit_flags)

    # Recall denominator: count distinct (filename_pattern, page) pairs in the gold set.
    # We approximate with (pattern, page) tuples — close enough for our metric.
    expected_count = sum(len(e.page_numbers) for e in expected)

    precision = (hit_count / top_k) if top_k > 0 else 0.0
    recall = (hit_count / expected_count) if expected_count > 0 else 0.0
    rr = 0.0
    for i, flag in enumerate(hit_flags, start=1):
        if flag:
            rr = 1.0 / i
            break

    return RetrievalMetrics(
        precision_at_k=precision,
        recall_at_k=recall,
        reciprocal_rank=rr,
        hits=hit_count,
    )


def aggregate(per_item: list[RetrievalMetrics]) -> dict[str, float]:
    n = len(per_item) or 1
    return {
        "precision_at_k": sum(m.precision_at_k for m in per_item) / n,
        "recall_at_k": sum(m.recall_at_k for m in per_item) / n,
        "mrr": sum(m.reciprocal_rank for m in per_item) / n,
    }
