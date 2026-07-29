"""End-to-end eval runner.

Reads the golden set, hits the local Polaris chat endpoint with each question
(Bearer token from $POLARIS_EVAL_BEARER), captures citations + answer,
computes retrieval metrics, asks the LLM judge to score the answer, and
writes a markdown report.

Usage:
    POLARIS_EVAL_BEARER=<id-token> GROQ_API_KEY=<...> python -m evals.runners.run_eval
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx

from evals.runners import judge as judge_mod
from evals.runners import metrics
from evals.runners.report import write_markdown
from evals.runners.schema import (
    AnswerMetrics,
    ExpectedPassage,
    GoldenItem,
    ItemResult,
    RetrievalMetrics,
    RetrievedHit,
)

ROOT = Path(__file__).resolve().parent.parent
GOLDEN_PATH = ROOT / "datasets" / "golden.jsonl"
REPORTS_DIR = ROOT / "reports"

API_BASE = os.getenv("POLARIS_API_BASE", "http://localhost:8000")
BEARER = os.getenv("POLARIS_EVAL_BEARER")
GROQ_API_KEYS_RAW = os.getenv("GROQ_API_KEYS") or os.getenv("GROQ_API_KEY")
GROQ_API_KEYS = [k.strip() for k in GROQ_API_KEYS_RAW.split(",") if k.strip()] if GROQ_API_KEYS_RAW else []
JUDGE_MODEL = os.getenv("GROQ_JUDGE_MODEL", "llama-3.3-70b-versatile")
TOP_K = int(os.getenv("POLARIS_EVAL_TOP_K", "5"))


def _load_golden(path: Path) -> list[GoldenItem]:
    items: list[GoldenItem] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        raw = json.loads(line)
        items.append(
            GoldenItem(
                id=raw["id"],
                question=raw["question"],
                expected_passages=[
                    ExpectedPassage(
                        document_filename_pattern=p["document_filename_pattern"],
                        page_numbers=list(p["page_numbers"]),
                    )
                    for p in raw["expected_passages"]
                ],
                expected_answer_traits=list(raw["expected_answer_traits"]),
            )
        )
    return items


async def _run_one(client: httpx.AsyncClient, item: GoldenItem) -> ItemResult:
    citations: list[RetrievedHit] = []
    answer_chunks: list[str] = []
    error: str | None = None

    headers = {"Authorization": f"Bearer {BEARER}", "Accept": "text/event-stream"}
    body = {"question": item.question, "top_k": TOP_K}

    try:
        async with client.stream(
            "POST", f"{API_BASE}/api/chat/stream",
            headers=headers, json=body, timeout=60.0,
        ) as resp:
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}")
            buffer = ""
            async for chunk in resp.aiter_text():
                buffer += chunk
                while "\n\n" in buffer:
                    frame, buffer = buffer.split("\n\n", 1)
                    data_line = next(
                        (l for l in frame.splitlines() if l.startswith("data:")),
                        None,
                    )
                    if not data_line:
                        continue
                    payload = json.loads(data_line[len("data:"):].strip())
                    if payload["type"] == "citations":
                        citations = [
                            RetrievedHit(
                                document_filename=c["document_filename"],
                                page_number=int(c["page_number"]),
                                text=c["text"],
                                score=float(c["score"]),
                            )
                            for c in payload["citations"]
                        ]
                    elif payload["type"] == "token":
                        answer_chunks.append(payload["content"])
    except Exception as exc:  # noqa: BLE001
        error = str(exc)

    retrieval = metrics.compute(citations, item.expected_passages, top_k=TOP_K)
    answer = "".join(answer_chunks)

    if error:
        return ItemResult(
            item=item, answer="", citations=citations,
            retrieval=retrieval,
            answer_metrics=AnswerMetrics(grounding_score=0.0),
            error=error,
        )

    # LLM-as-judge
    from app.services.groq_client import GroqClient
    groq_client = GroqClient(api_keys=GROQ_API_KEYS, model=JUDGE_MODEL)

    async def _groq_complete(prompt: str) -> str:
        return await groq_client.complete(prompt, temperature=0.0, max_tokens=600)

    answer_metrics = await judge_mod.judge(
        item=item, answer=answer, groq_complete=_groq_complete,
    )
    return ItemResult(
        item=item, answer=answer, citations=citations,
        retrieval=retrieval, answer_metrics=answer_metrics,
    )


async def main() -> int:
    if not BEARER:
        print("ERROR: POLARIS_EVAL_BEARER not set (need a Firebase ID token)", file=sys.stderr)
        return 2
    if not GROQ_API_KEYS:
        print("ERROR: Neither GROQ_API_KEYS nor GROQ_API_KEY is set", file=sys.stderr)
        return 2

    items = _load_golden(GOLDEN_PATH)
    print(f"Loaded {len(items)} golden items. top_k={TOP_K}")

    async with httpx.AsyncClient() as client:
        results: list[ItemResult] = []
        for item in items:
            print(f"  -> {item.id}")
            results.append(await _run_one(client, item))

    out = write_markdown(results, out_dir=REPORTS_DIR, top_k=TOP_K)
    print(f"\nReport: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
