from __future__ import annotations

from app.models.planner import DaySchedule, RevisionPlan, StudyBlock
from app.services.plan_diff_service import compute_plan_diff


def test_compute_plan_diff_added_removed_rescheduled():
    old_plan = RevisionPlan(
        plan_id="plan_old",
        user_id="user1",
        exam_date="2026-08-15",
        daily_hours=2.0,
        schedules=[
            DaySchedule(
                date="2026-08-01",
                available_hours=2.0,
                blocks=[
                    StudyBlock(
                        topic_id="topic_a",
                        topic_title="Topic A",
                        allocated_minutes=60,
                        priority="high",
                    ),
                    StudyBlock(
                        topic_id="topic_b",
                        topic_title="Topic B",
                        allocated_minutes=60,
                        priority="medium",
                    ),
                ],
            )
        ],
        total_hours_allocated=2.0,
        created_at="2026-07-29T12:00:00Z",
    )

    new_plan = RevisionPlan(
        plan_id="plan_new",
        user_id="user1",
        exam_date="2026-08-15",
        daily_hours=2.0,
        schedules=[
            DaySchedule(
                date="2026-08-01",
                available_hours=2.0,
                blocks=[
                    StudyBlock(
                        topic_id="topic_a",
                        topic_title="Topic A",
                        allocated_minutes=90,  # Duration changed
                        priority="high",
                    ),
                    StudyBlock(
                        topic_id="topic_c",
                        topic_title="Topic C",  # Added topic
                        allocated_minutes=30,
                        priority="low",
                    ),
                ],
            ),
            DaySchedule(
                date="2026-08-02",
                available_hours=2.0,
                blocks=[
                    # Topic B removed from Aug 01, absent here
                ],
            ),
        ],
        total_hours_allocated=2.0,
        created_at="2026-07-30T12:00:00Z",
    )

    diff = compute_plan_diff(old_plan, new_plan)

    assert diff.old_plan_id == "plan_old"
    assert diff.new_plan_id == "plan_new"
    assert len(diff.diffs) == 3

    diff_map = {item.topic_id: item for item in diff.diffs}

    # topic_b was removed
    assert "topic_b" in diff_map
    assert diff_map["topic_b"].change_type == "removed"

    # topic_c was added
    assert "topic_c" in diff_map
    assert diff_map["topic_c"].change_type == "added"

    # topic_a duration changed
    assert "topic_a" in diff_map
    assert diff_map["topic_a"].change_type == "duration_changed"
    assert diff_map["topic_a"].old_minutes == 60
    assert diff_map["topic_a"].new_minutes == 90
