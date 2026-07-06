"""Exhaustively walk the document status state machine.

If a transition is added/removed, this test should be the first to fail —
that's the point. State machines drift silently otherwise.
"""

import pytest
from app.models.document import DocumentStatus
from app.services.status_transition import (
    VALID_TRANSITIONS,
    InvalidTransitionError,
    assert_transition,
)


def test_every_status_is_keyed_in_the_transition_map() -> None:
    assert set(VALID_TRANSITIONS.keys()) == set(DocumentStatus)


def test_no_self_transitions() -> None:
    for status, targets in VALID_TRANSITIONS.items():
        assert status not in targets, f"{status} → {status} is a no-op, remove it"


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (DocumentStatus.REQUESTED, DocumentStatus.UPLOADED),
        (DocumentStatus.UPLOADED, DocumentStatus.QUEUED),
        (DocumentStatus.QUEUED, DocumentStatus.PROCESSING),
        (DocumentStatus.PROCESSING, DocumentStatus.OCR_COMPLETE),
        (DocumentStatus.PROCESSING, DocumentStatus.FAILED),
        (DocumentStatus.OCR_COMPLETE, DocumentStatus.INDEXING),
        (DocumentStatus.OCR_COMPLETE, DocumentStatus.QUEUED),  # user-triggered reprocess
        (DocumentStatus.INDEXING, DocumentStatus.INDEXED),
        (DocumentStatus.INDEXING, DocumentStatus.FAILED),
        (DocumentStatus.INDEXED, DocumentStatus.QUEUED),
        (DocumentStatus.FAILED, DocumentStatus.QUEUED),
    ],
)
def test_valid_transitions_pass(current, target) -> None:
    assert_transition(current, target)  # raises on failure


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (DocumentStatus.REQUESTED, DocumentStatus.OCR_COMPLETE),
        (DocumentStatus.REQUESTED, DocumentStatus.QUEUED),
        (DocumentStatus.UPLOADED, DocumentStatus.OCR_COMPLETE),
        (DocumentStatus.QUEUED, DocumentStatus.UPLOADED),
        (DocumentStatus.OCR_COMPLETE, DocumentStatus.PROCESSING),
        (DocumentStatus.OCR_COMPLETE, DocumentStatus.INDEXED),  # must go through INDEXING
        (DocumentStatus.INDEXED, DocumentStatus.PROCESSING),
        (DocumentStatus.FAILED, DocumentStatus.OCR_COMPLETE),
    ],
)
def test_invalid_transitions_raise(current, target) -> None:
    with pytest.raises(InvalidTransitionError):
        assert_transition(current, target)
