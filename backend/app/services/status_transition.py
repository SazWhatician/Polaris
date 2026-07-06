"""Document status state machine. Single source of truth for valid transitions.

Used by services to guard against impossible state changes and by tests to
prove the state machine is exhaustive.
"""

from __future__ import annotations

from app.models.document import DocumentStatus

VALID_TRANSITIONS: dict[DocumentStatus, frozenset[DocumentStatus]] = {
    DocumentStatus.REQUESTED: frozenset({DocumentStatus.UPLOADED, DocumentStatus.FAILED}),
    DocumentStatus.UPLOADED: frozenset({DocumentStatus.QUEUED}),
    DocumentStatus.QUEUED: frozenset({DocumentStatus.PROCESSING, DocumentStatus.FAILED}),
    DocumentStatus.PROCESSING: frozenset({DocumentStatus.OCR_COMPLETE, DocumentStatus.FAILED}),
    # OCR done; can chain to INDEXING, fail, or be requeued by user for re-OCR.
    DocumentStatus.OCR_COMPLETE: frozenset(
        {DocumentStatus.INDEXING, DocumentStatus.FAILED, DocumentStatus.QUEUED}
    ),
    DocumentStatus.INDEXING: frozenset({DocumentStatus.INDEXED, DocumentStatus.FAILED}),
    DocumentStatus.INDEXED: frozenset({DocumentStatus.QUEUED}),  # full reprocess
    DocumentStatus.FAILED: frozenset({DocumentStatus.QUEUED}),  # retry
}


class InvalidTransitionError(Exception):
    def __init__(self, current: DocumentStatus, target: DocumentStatus) -> None:
        super().__init__(f"Cannot transition from {current} to {target}")
        self.current = current
        self.target = target


def assert_transition(current: DocumentStatus, target: DocumentStatus) -> None:
    if target not in VALID_TRANSITIONS.get(current, frozenset()):
        raise InvalidTransitionError(current, target)
