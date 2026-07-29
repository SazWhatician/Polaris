from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import pytest
from app.agents.gap_agent import GapAgent, rank_gaps, sanitize_prerequisites
from app.models.syllabus import Syllabus, SyllabusCoverage, Topic, TopicCoverage


class FakeSyllabusRepo:
    def __init__(self) -> None:
        self.syllabi: dict[tuple[str, str], Syllabus] = {}
        self.coverages: dict[tuple[str, str], SyllabusCoverage] = {}

    async def get(self, user_id: str, syllabus_id: str) -> Syllabus | None:
        return self.syllabi.get((user_id, syllabus_id))

    async def get_coverage(self, user_id: str, syllabus_id: str) -> SyllabusCoverage | None:
        return self.coverages.get((user_id, syllabus_id))


class FakeGroqClient:
    def __init__(self) -> None:
        self.completions: list[str] = []

    async def complete(self, prompt: str, json_mode: bool = False, **kwargs: Any) -> str:
        if self.completions:
            return self.completions.pop(0)
        return "{}"


def test_sanitize_prerequisites() -> None:
    valid_ids = {"t1", "t2", "t3"}
    prereqs = {
        "t1": ["t2"],
        "t2": ["t1"],  # Simple cycle: t1 -> t2 and t2 -> t1
        "t3": ["t4", "t1"],  # t4 is invalid ID
    }
    sanitized = sanitize_prerequisites(prereqs, valid_ids)
    assert sanitized["t3"] == ["t1"]
    # Check that the cycle is broken (either t1 doesn't have t2, or t2 doesn't have t1)
    assert not ("t1" in sanitized["t2"] and "t2" in sanitized["t1"])


def test_rank_gaps() -> None:
    gap_ids = ["t2", "t1", "t3"]
    prereqs = {
        "t1": [],
        "t2": ["t1"],  # t2 depends on t1
        "t3": [],
    }
    original_order = ["t1", "t2", "t3"]
    ranked = rank_gaps(gap_ids, prereqs, original_order)
    # t1 must come before t2
    assert ranked.index("t1") < ranked.index("t2")


@pytest.mark.asyncio
async def test_gap_agent_end_to_end_flow() -> None:
    syllabus_repo = FakeSyllabusRepo()
    groq_client = FakeGroqClient()

    # Seed syllabus
    t1 = Topic(id="t1", title="Basics of Network", description="Networking 101", subtopics=[])
    t2 = Topic(id="t2", title="Firewalls", description="Configuring firewalls", subtopics=[])
    syllabus = Syllabus(
        id="s1",
        user_id="alice",
        name="Network Security",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        tree=[t1, t2],
    )
    syllabus_repo.syllabi[("alice", "s1")] = syllabus

    # Seed coverage: t1 is good (known), t2 is none (missing)
    coverage = SyllabusCoverage(
        syllabus_id="s1",
        overall_score=50.0,
        topics={
            "t1": TopicCoverage(
                topic_id="t1",
                score=90.0,
                status="good",
                explanation="Well covered",
                matched_chunks=[],
            ),
            "t2": TopicCoverage(
                topic_id="t2",
                score=10.0,
                status="none",
                explanation="No notes found",
                matched_chunks=[],
            ),
        },
        updated_at=datetime.now(UTC),
    )
    syllabus_repo.coverages[("alice", "s1")] = coverage

    # Mock Groq completions:
    # 1. Prereqs query response
    prereqs_json = {"t1": [], "t2": ["t1"]}
    groq_client.completions.append(json.dumps(prereqs_json))

    # 2. Recommendations query response
    recommendations_json = {
        "recommendations": [
            {
                "topic_id": "t2",
                "title": "Firewalls",
                "status": "missing",
                "reason": "This topic is missing from your notes.",
                "actionable_steps": [
                    "Read Chapter 5 on Firewalls.",
                    "Practice setting up iptables.",
                ],
                "estimated_hours": 3.0,
            }
        ]
    }
    groq_client.completions.append(json.dumps(recommendations_json))

    # Run agent
    agent = GapAgent(syllabus_repo=syllabus_repo, groq_client=groq_client)  # type: ignore[arg-type]
    graph = agent.compile()

    state = {
        "user_id": "alice",
        "syllabus_id": "s1",
        "document_ids": [],
        "raw_syllabus": None,
        "coverage_map": None,
        "gaps": {},
        "prerequisites": {},
        "recommendations": [],
        "retry_count": 0,
        "error": None,
    }

    final_state = await graph.ainvoke(state)

    assert final_state.get("error") is None
    assert final_state["gaps"] == {"t1": "known", "t2": "missing"}
    assert final_state["prerequisites"] == {"t1": [], "t2": ["t1"]}

    recs = final_state["recommendations"]
    assert len(recs) == 1
    assert recs[0]["topic_id"] == "t2"
    assert recs[0]["status"] == "missing"
    assert recs[0]["estimated_hours"] == 3.0
