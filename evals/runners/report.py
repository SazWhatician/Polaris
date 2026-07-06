"""Markdown report writer."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

from evals.runners.metrics import aggregate
from evals.runners.schema import ItemResult


def write_markdown(results: list[ItemResult], *, out_dir: Path, top_k: int) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    path = out_dir / f"{ts}.md"

    retrieval_agg = aggregate([r.retrieval for r in results])
    overall_grounding = (
        sum(r.answer_metrics.grounding_score for r in results) / len(results)
        if results else 0.0
    )
    overall_traits = (
        sum(r.answer_metrics.traits_satisfied_ratio for r in results) / len(results)
        if results else 0.0
    )

    lines: list[str] = []
    lines.append(f"# Polaris Eval — {ts}")
    lines.append("")
    lines.append(f"- Items: **{len(results)}**")
    lines.append(f"- top_k: **{top_k}**")
    lines.append("")
    lines.append("## Aggregate")
    lines.append("")
    lines.append("| metric | value |")
    lines.append("| --- | --- |")
    lines.append(f"| precision@{top_k} | {retrieval_agg['precision_at_k']:.3f} |")
    lines.append(f"| recall@{top_k} | {retrieval_agg['recall_at_k']:.3f} |")
    lines.append(f"| MRR | {retrieval_agg['mrr']:.3f} |")
    lines.append(f"| trait-satisfaction (answer) | {overall_traits:.3f} |")
    lines.append(f"| grounding (judge) | {overall_grounding:.3f} |")
    lines.append("")

    lines.append("## Per-item")
    lines.append("")
    lines.append("| id | precision | recall | MRR | traits | grounding | error |")
    lines.append("| --- | --- | --- | --- | --- | --- | --- |")
    for r in results:
        err = r.error or ""
        lines.append(
            f"| {r.item.id} "
            f"| {r.retrieval.precision_at_k:.2f} "
            f"| {r.retrieval.recall_at_k:.2f} "
            f"| {r.retrieval.reciprocal_rank:.2f} "
            f"| {r.answer_metrics.traits_satisfied_ratio:.2f} "
            f"| {r.answer_metrics.grounding_score:.2f} "
            f"| {err} |"
        )
    lines.append("")

    lines.append("## Details")
    lines.append("")
    for r in results:
        lines.append(f"### `{r.item.id}` — {r.item.question}")
        lines.append("")
        lines.append("**Citations:**")
        for h in r.citations:
            lines.append(f"- _{h.document_filename}_ p.{h.page_number} (score={h.score:.2f})")
        lines.append("")
        lines.append("**Answer:**")
        lines.append("")
        lines.append(f"> {r.answer.strip()[:500]}{'…' if len(r.answer) > 500 else ''}")
        lines.append("")
        lines.append(f"_judge_: {r.answer_metrics.judge_reasoning}")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path
