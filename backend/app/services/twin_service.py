from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Optional

from google.cloud.firestore import Client

from app.core.firebase import get_firestore
from app.models.twin import AcademicTwin, TwinSignal, VelocityPoint
from app.repositories.graph_repo import GraphRepository

logger = logging.getLogger(__name__)

# In-memory cache for active twins
_twin_cache: dict[str, AcademicTwin] = {}


class TwinService:
    """Manages the Academic Digital Twin — incremental updates, velocity, readiness."""

    def __init__(self, db: Client | None = None, graph_repo: GraphRepository | None = None):
        self._db = db
        self.graph_repo = graph_repo or GraphRepository()

    @property
    def db(self) -> Client:
        if self._db is None:
            self._db = get_firestore()
        return self._db

    async def get_twin(self, user_id: str) -> AcademicTwin:
        """Fetch or create the user's academic twin."""
        if user_id in _twin_cache:
            return _twin_cache[user_id]

        try:
            doc_ref = self.db.collection("users").document(user_id).collection("twin").document("state")
            snapshot = doc_ref.get()
            if snapshot.exists:
                twin = AcademicTwin.model_validate(snapshot.to_dict())
                _twin_cache[user_id] = twin
                return twin
        except Exception as e:
            logger.warning("Failed to fetch twin for %s: %s", user_id, e)

        # Create fresh twin seeded from knowledge graph
        twin = await self._seed_from_graph(user_id)
        _twin_cache[user_id] = twin
        self._persist(user_id, twin)
        return twin

    async def ingest_signal(self, user_id: str, signal: TwinSignal) -> AcademicTwin:
        """Process a study signal and update the twin state."""
        twin = await self.get_twin(user_id)

        # If signal has a concept, promote it toward known
        concept_id = signal.concept_id or signal.topic_id
        if concept_id:
            if concept_id in twin.missing_concepts:
                twin.missing_concepts.remove(concept_id)
                twin.weak_concepts.append(concept_id)
            elif concept_id in twin.weak_concepts:
                twin.weak_concepts.remove(concept_id)
                twin.known_concepts.append(concept_id)

        twin.signals_count += 1
        twin.last_updated = datetime.now(UTC).isoformat()

        # Update velocity for current ISO week
        current_week = datetime.now(UTC).strftime("%G-W%V")
        if twin.velocity and twin.velocity[-1].week == current_week:
            twin.velocity[-1].concepts_learned = len(twin.known_concepts)
        else:
            twin.velocity.append(
                VelocityPoint(week=current_week, concepts_learned=len(twin.known_concepts))
            )
        # Keep only last 12 weeks
        twin.velocity = twin.velocity[-12:]

        _twin_cache[user_id] = twin
        self._persist(user_id, twin)
        return twin

    def check_readiness(self, user_id: str, target_concept_id: str) -> dict:
        """Check if user is ready to learn a concept via prerequisite graph traversal."""
        graph = self.graph_repo.get_latest_graph(user_id)
        twin = _twin_cache.get(user_id)

        if not graph or not twin:
            return {
                "target_concept": target_concept_id,
                "ready": False,
                "ready_prerequisites": [],
                "missing_prerequisites": [],
                "summary": "No knowledge graph or twin data available. Upload notes and run gap analysis first.",
            }

        # Find prerequisites of the target concept
        nodes_by_id = {n.id: n for n in graph.nodes}
        prereq_ids: list[str] = []
        for edge in graph.edges:
            if edge.target_concept_id == target_concept_id and edge.relation_type == "prerequisite_of":
                prereq_ids.append(edge.source_concept_id)

        known_set = set(twin.known_concepts)
        ready_prereqs = []
        missing_prereqs = []

        for pid in prereq_ids:
            node = nodes_by_id.get(pid)
            name = node.name if node else pid
            if pid in known_set:
                ready_prereqs.append({"concept_id": pid, "name": name, "status": "ready"})
            else:
                missing_prereqs.append({"concept_id": pid, "name": name, "status": "missing"})

        is_ready = len(missing_prereqs) == 0 and len(prereq_ids) > 0
        target_name = nodes_by_id[target_concept_id].name if target_concept_id in nodes_by_id else target_concept_id

        if not prereq_ids:
            summary = f"No prerequisites found for '{target_name}'. You can start learning it now."
            is_ready = True
        elif is_ready:
            summary = f"You're ready to learn '{target_name}'! All {len(ready_prereqs)} prerequisites are covered."
        else:
            summary = f"Not quite ready for '{target_name}'. {len(missing_prereqs)} of {len(prereq_ids)} prerequisites are missing."

        return {
            "target_concept": target_name,
            "ready": is_ready,
            "ready_prerequisites": ready_prereqs,
            "missing_prerequisites": missing_prereqs,
            "summary": summary,
        }

    async def _seed_from_graph(self, user_id: str) -> AcademicTwin:
        """Bootstrap twin state from the knowledge graph + gap analysis."""
        graph = self.graph_repo.get_latest_graph(user_id)
        known = []
        missing = []

        if graph:
            # All graph nodes start as missing; they'll be promoted via signals
            missing = [n.id for n in graph.nodes]

        current_week = datetime.now(UTC).strftime("%G-W%V")
        return AcademicTwin(
            user_id=user_id,
            known_concepts=known,
            weak_concepts=[],
            missing_concepts=missing,
            velocity=[VelocityPoint(week=current_week, concepts_learned=0)],
        )

    def _persist(self, user_id: str, twin: AcademicTwin) -> None:
        """Best-effort persist to Firestore."""
        try:
            doc_ref = self.db.collection("users").document(user_id).collection("twin").document("state")
            doc_ref.set(twin.model_dump())
        except Exception as e:
            logger.warning("Failed to persist twin for %s: %s", user_id, e)
