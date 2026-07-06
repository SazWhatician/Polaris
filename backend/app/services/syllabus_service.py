from __future__ import annotations

import asyncio
import json
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from opentelemetry import trace
from pydantic import BaseModel, Field, ValidationError

from app.core.logging import get_logger
from app.models.syllabus import Syllabus, SyllabusCoverage, Topic, TopicCoverage
from app.services import prompts

if TYPE_CHECKING:
    from app.repositories.document_repo import DocumentRepository
    from app.repositories.page_repo import PageRepository
    from app.repositories.qdrant_repo import QdrantRepository
    from app.repositories.syllabus_repo import SyllabusRepository
    from app.services.embedding_service import EmbeddingService
    from app.services.groq_client import GroqClient

log = get_logger(__name__)
tracer = trace.get_tracer(__name__)


# Helper models to validate LLM JSON structure directly
class LLMTopic(BaseModel):
    id: str
    title: str
    description: str | None = None
    subtopics: list[LLMTopic] = Field(default_factory=list)


LLMTopic.model_rebuild()


class LLMTopicTree(BaseModel):
    topics: list[LLMTopic]


class LLMCoverageGrade(BaseModel):
    score: float
    status: str
    explanation: str


class SyllabusServiceError(Exception):
    """Base error for SyllabusService operations."""


class SyllabusNotFoundError(SyllabusServiceError):
    """Raised when syllabus is not found."""


class SyllabusValidationError(SyllabusServiceError):
    """Raised when input validation fails."""


class SyllabusService:
    def __init__(
        self,
        *,
        syllabus_repo: SyllabusRepository,
        doc_repo: DocumentRepository,
        page_repo: PageRepository,
        qdrant_repo: QdrantRepository,
        embedder: EmbeddingService,
        groq: GroqClient,
    ) -> None:
        self._syllabus_repo = syllabus_repo
        self._doc_repo = doc_repo
        self._page_repo = page_repo
        self._qdrant_repo = qdrant_repo
        self._embedder = embedder
        self._groq = groq

    async def create_syllabus(
        self,
        user_id: str,
        name: str,
        syllabus_text: str | None = None,
        document_id: str | None = None,
    ) -> Syllabus:
        """Create a syllabus. Parses the text into a structured topic tree using the LLM."""
        if not syllabus_text and not document_id:
            raise SyllabusValidationError("Either syllabus_text or document_id must be provided")
        if syllabus_text and document_id:
            raise SyllabusValidationError("Provide either syllabus_text or document_id, not both")

        # Resolve syllabus text
        text_to_parse = ""
        if syllabus_text:
            text_to_parse = syllabus_text.strip()
        else:
            assert document_id is not None
            doc = await self._doc_repo.get(user_id, document_id)
            if not doc:
                raise SyllabusValidationError("Document not found or access denied")
            pages = await self._page_repo.list_pages(user_id, document_id)
            if not pages:
                raise SyllabusValidationError("Document pages not found. Wait for OCR to complete.")
            text_to_parse = "\n\n".join(p.text for p in pages if p.text)

        if not text_to_parse:
            raise SyllabusValidationError("No text content available in syllabus")

        # Call LLM to parse text into Topic Tree
        tree = await self._extract_topic_tree(text_to_parse)

        now = datetime.now(UTC)
        syllabus = Syllabus(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            created_at=now,
            updated_at=now,
            tree=tree,
        )

        await self._syllabus_repo.create(syllabus)
        log.info("syllabus.created", user_id=user_id, syllabus_id=syllabus.id, name=name)
        return syllabus

    async def get_syllabus(self, user_id: str, syllabus_id: str) -> Syllabus | None:
        return await self._syllabus_repo.get(user_id, syllabus_id)

    async def list_syllabi(self, user_id: str, limit: int = 50) -> list[Syllabus]:
        return await self._syllabus_repo.list(user_id, limit=limit)

    async def delete_syllabus(self, user_id: str, syllabus_id: str) -> None:
        await self._syllabus_repo.delete(user_id, syllabus_id)
        await self._syllabus_repo.delete_coverage(user_id, syllabus_id)
        log.info("syllabus.deleted", user_id=user_id, syllabus_id=syllabus_id)

    async def compute_coverage(
        self,
        user_id: str,
        syllabus_id: str,
        document_ids: list[str] | None = None,
        similarity_threshold: float = 0.4,
        retrieval_weight: float = 0.3,
        llm_weight: float = 0.7,
    ) -> SyllabusCoverage:
        """Compute coverage score for all topics in the syllabus."""
        syllabus = await self.get_syllabus(user_id, syllabus_id)
        if not syllabus:
            raise SyllabusNotFoundError(f"Syllabus {syllabus_id} not found")

        # Extract leaf and non-leaf topics
        leaf_topics: list[Topic] = []
        non_leaf_topics: list[Topic] = []

        def traverse(topics: list[Topic]) -> None:
            for t in topics:
                if not t.subtopics:
                    leaf_topics.append(t)
                else:
                    non_leaf_topics.append(t)
                    traverse(t.subtopics)

        traverse(syllabus.tree)

        coverage_map: dict[str, TopicCoverage] = {}

        # Concurrency limiter to protect Groq API rate limits
        sem = asyncio.Semaphore(5)

        async def score_leaf(topic: Topic) -> None:
            async with sem:
                # 1. Embed topic title & description
                topic_query = f"{topic.title}: {topic.description or ''}"
                qvec = await self._embedder.embed_one(topic_query)

                # 2. Retrieve notes chunks from Qdrant
                chunks = await self._qdrant_repo.search(
                    user_id=user_id,
                    query_vector=qvec,
                    top_k=5,
                    document_ids=document_ids,
                )

                # Filter by similarity threshold
                matching_chunks = [c for c in chunks if c.score >= similarity_threshold]

                if not matching_chunks:
                    # No chunks found, short-circuit
                    coverage_map[topic.id] = TopicCoverage(
                        topic_id=topic.id,
                        score=0.0,
                        status="none",
                        explanation="No relevant notes matched this topic.",
                        matched_chunks=[],
                    )
                    return

                # Calculate retrieval component score
                # Count matching chunks up to 5, normalized to 0-100
                retrieval_score = (min(len(matching_chunks), 5) / 5.0) * 100.0

                # 3. Call LLM for rubric scoring
                llm_grade = await self._grade_topic_coverage_with_llm(topic, matching_chunks)

                # Combine scores
                combined_score = (retrieval_weight * retrieval_score) + (
                    llm_weight * llm_grade.score
                )
                combined_score = max(0.0, min(100.0, combined_score))

                # Determine status
                if combined_score >= 70.0:
                    status = "good"
                elif combined_score >= 30.0:
                    status = "partial"
                else:
                    status = "none"

                coverage_map[topic.id] = TopicCoverage(
                    topic_id=topic.id,
                    score=combined_score,
                    status=status,
                    explanation=llm_grade.explanation,
                    matched_chunks=[c.model_dump() for c in matching_chunks],
                )

        # Run leaf scoring in parallel with semaphore control
        await asyncio.gather(*(score_leaf(topic) for topic in leaf_topics))

        # Roll up coverage scores recursively for non-leaf topics
        def roll_up(topics: list[Topic]) -> None:
            for t in topics:
                # Process children first (depth-first traversal)
                if t.subtopics:
                    roll_up(t.subtopics)
                    child_scores = [
                        coverage_map[child.id].score
                        for child in t.subtopics
                        if child.id in coverage_map
                    ]
                    avg_score = sum(child_scores) / len(child_scores) if child_scores else 0.0

                    if avg_score >= 70.0:
                        status = "good"
                    elif avg_score >= 30.0:
                        status = "partial"
                    else:
                        status = "none"

                    coverage_map[t.id] = TopicCoverage(
                        topic_id=t.id,
                        score=avg_score,
                        status=status,
                        explanation=f"Roll-up average of {len(t.subtopics)} subtopics.",
                        matched_chunks=[],
                    )

        roll_up(syllabus.tree)

        # Overall score is the average of all top-level topics (or leaf topics)
        # The spec mentions: "overall_score: average coverage score across all leaf topics"
        leaf_scores = [coverage_map[t.id].score for t in leaf_topics if t.id in coverage_map]
        overall_score = sum(leaf_scores) / len(leaf_scores) if leaf_scores else 0.0

        coverage = SyllabusCoverage(
            syllabus_id=syllabus.id,
            overall_score=overall_score,
            topics=coverage_map,
            updated_at=datetime.now(UTC),
        )

        await self._syllabus_repo.save_coverage(user_id, coverage)
        log.info(
            "syllabus.coverage_computed",
            user_id=user_id,
            syllabus_id=syllabus.id,
            overall_score=overall_score,
        )
        return coverage

    async def get_coverage(self, user_id: str, syllabus_id: str) -> SyllabusCoverage | None:
        return await self._syllabus_repo.get_coverage(user_id, syllabus_id)

    # ------- Internal Helpers / LLM JSON validation retries -------

    async def _extract_topic_tree(self, text: str) -> list[Topic]:
        """Call LLM with JSON mode and Pydantic validation. Retries on mismatch."""
        template = prompts.load("syllabus_extraction", "v1")
        prompt = template.format(syllabus_text=text)

        with tracer.start_as_current_span("syllabus.extract_tree"):
            try:
                raw_out = await self._groq.complete(prompt, json_mode=True, temperature=0.0)
                parsed = LLMTopicTree.model_validate_json(raw_out)
                return self._map_llm_topics(parsed.topics)
            except (json.JSONDecodeError, ValidationError) as exc:
                log.warning("syllabus.extract_tree.validation_failed", error=str(exc))
                # Trigger corrective retry
                corrected_prompt = (
                    f"The previous output failed validation with the following error:\n{exc}\n\n"
                    f"Here was the invalid output:\n"
                    f"{raw_out if 'raw_out' in locals() else 'empty'}\n\n"
                    "Correct the output and return a valid JSON object matching "
                    "the requested schema structure strictly. "
                    "Return ONLY raw parseable JSON."
                )
                try:
                    raw_out_retry = await self._groq.complete(
                        corrected_prompt, json_mode=True, temperature=0.0
                    )
                    parsed_retry = LLMTopicTree.model_validate_json(raw_out_retry)
                    return self._map_llm_topics(parsed_retry.topics)
                except Exception as final_exc:
                    log.error("syllabus.extract_tree.retry_failed", error=str(final_exc))
                    # If LLM retry fails, return a simple fallback single-topic tree
                    # rather than failing entirely
                    fallback_id = str(uuid.uuid4())[:8]
                    return [
                        Topic(
                            id=fallback_id,
                            title="Syllabus Content",
                            description="Extracted curriculum elements (fallback)",
                            subtopics=[],
                        )
                    ]

    async def _grade_topic_coverage_with_llm(
        self, topic: Topic, chunks: list[Any]
    ) -> LLMCoverageGrade:
        """Evaluate leaf topic coverage using notes content."""
        template = prompts.load("topic_coverage", "v1")

        formatted_chunks = ""
        for i, c in enumerate(chunks, start=1):
            formatted_chunks += f"--- Source Chunk {i} ---\n{c.text}\n\n"

        prompt = template.format(
            topic_title=topic.title,
            topic_description=topic.description or "",
            chunks=formatted_chunks,
        )

        with tracer.start_as_current_span("syllabus.grade_topic_coverage"):
            try:
                raw_out = await self._groq.complete(prompt, json_mode=True, temperature=0.0)
                return LLMCoverageGrade.model_validate_json(raw_out)
            except (json.JSONDecodeError, ValidationError) as exc:
                log.warning("syllabus.grade_topic.validation_failed", error=str(exc))
                # Corrective retry
                corrected_prompt = (
                    f"The previous output failed validation with the following error:\n{exc}\n\n"
                    f"Here was the invalid output:\n"
                    f"{raw_out if 'raw_out' in locals() else 'empty'}\n\n"
                    "Correct the output and return a valid JSON object "
                    "matching the schema strictly. "
                    "Return ONLY raw parseable JSON."
                )
                try:
                    raw_out_retry = await self._groq.complete(
                        corrected_prompt, json_mode=True, temperature=0.0
                    )
                    return LLMCoverageGrade.model_validate_json(raw_out_retry)
                except Exception as final_exc:
                    log.error("syllabus.grade_topic.retry_failed", error=str(final_exc))
                    # Safe fallback
                    return LLMCoverageGrade(
                        score=50.0,
                        status="partial",
                        explanation="Unable to parse LLM grading; fallback assigned.",
                    )

    def _map_llm_topics(self, llm_topics: list[LLMTopic]) -> list[Topic]:
        """Recursively map the flat LLMTopic validation models to the db Topic models."""
        result = []
        for t in llm_topics:
            result.append(
                Topic(
                    id=t.id,
                    title=t.title,
                    description=t.description,
                    subtopics=self._map_llm_topics(t.subtopics),
                )
            )
        return result
