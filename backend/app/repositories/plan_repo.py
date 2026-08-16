from __future__ import annotations

from typing import Any
from firebase_admin import firestore

from app.models.planner import RevisionPlan


_mem_plans: dict[str, list[RevisionPlan]] = {}


class PlanRepository:
    def __init__(self, db: firestore.firestore.Client | None = None) -> None:
        self._db = db

    @property
    def db(self) -> firestore.firestore.Client:
        if self._db is None:
            self._db = firestore.client()
        return self._db

    def _plans_col(self, user_id: str) -> Any:
        return self.db.collection("users").document(user_id).collection("plans")

    async def save_plan(self, user_id: str, plan: RevisionPlan) -> None:
        """Saves a revision plan to Firestore under users/{user_id}/plans/{plan_id}."""
        if user_id not in _mem_plans:
            _mem_plans[user_id] = []
        _mem_plans[user_id] = [p for p in _mem_plans[user_id] if p.plan_id != plan.plan_id] + [plan]
        try:
            doc_ref = self._plans_col(user_id).document(plan.plan_id)
            doc_ref.set(plan.model_dump())
        except Exception:
            pass

    async def get_plan_by_id(self, user_id: str, plan_id: str) -> RevisionPlan | None:
        """Fetches a specific plan by plan_id."""
        for p in _mem_plans.get(user_id, []):
            if p.plan_id == plan_id:
                return p
        try:
            doc_ref = self._plans_col(user_id).document(plan_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            data = doc.to_dict() or {}
            return RevisionPlan(**data)
        except Exception:
            return None

    async def get_latest_plan(self, user_id: str) -> RevisionPlan | None:
        """Fetches the user's most recent revision plan ordered by created_at."""
        try:
            query = (
                self._plans_col(user_id)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(1)
            )
            docs = list(query.stream())
            if not docs:
                return _mem_plans.get(user_id, [None])[-1]
            data = docs[0].to_dict() or {}
            return RevisionPlan(**data)
        except Exception:
            user_plans = _mem_plans.get(user_id, [])
            return user_plans[-1] if user_plans else None
