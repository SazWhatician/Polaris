"""Typed eval models. Kept here (not in backend/) because the eval harness
ships independently of the API container."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ExpectedPassage:
    document_filename_pattern: str
    page_numbers: list[int]


@dataclass
class GoldenItem:
    id: str
    question: str
    expected_passages: list[ExpectedPassage]
    expected_answer_traits: list[str]


@dataclass
class RetrievedHit:
    document_filename: str
    page_number: int
    text: str
    score: float


@dataclass
class RetrievalMetrics:
    precision_at_k: float
    recall_at_k: float
    reciprocal_rank: float
    hits: int


@dataclass
class TraitScore:
    trait: str
    score: float  # 0 or 1


@dataclass
class AnswerMetrics:
    grounding_score: float  # 0..1
    trait_scores: list[TraitScore] = field(default_factory=list)
    judge_reasoning: str = ""

    @property
    def traits_satisfied_ratio(self) -> float:
        if not self.trait_scores:
            return 0.0
        return sum(t.score for t in self.trait_scores) / len(self.trait_scores)


@dataclass
class ItemResult:
    item: GoldenItem
    answer: str
    citations: list[RetrievedHit]
    retrieval: RetrievalMetrics
    answer_metrics: AnswerMetrics
    error: str | None = None
