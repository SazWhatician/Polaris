from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.agents.resource_agent import ResourceAgent
from app.repositories.resource_cache_repo import compute_topic_hash


@pytest.mark.asyncio
async def test_resource_agent_cache_miss_and_ranking():
    mock_youtube = MagicMock()
    mock_youtube.search_educational_videos = AsyncMock(
        return_value=[
            {
                "video_id": "v101",
                "title": "Binary Trees Explained",
                "channel_title": "3Blue1Brown",
                "url": "https://youtube.com/watch?v=v101",
                "thumbnail_url": "https://img/v101.jpg",
                "duration": "12:00",
                "description": "Visual guide to trees.",
            },
            {
                "video_id": "v102",
                "title": "Binary Trees Code Tutorial",
                "channel_title": "freeCodeCamp",
                "url": "https://youtube.com/watch?v=v102",
                "thumbnail_url": "https://img/v102.jpg",
                "duration": "25:00",
                "description": "Code walkthrough.",
            },
        ]
    )

    mock_cache_repo = MagicMock()
    mock_cache_repo.get_cached_resources = AsyncMock(return_value=None)
    mock_cache_repo.save_cached_resources = AsyncMock(return_value=None)

    mock_groq = MagicMock()
    mock_groq.complete = AsyncMock(
        return_value='[{"video_id": "v101", "rank_score": 0.95, "why_recommended": "Excellent visualization."}]'
    )

    agent = ResourceAgent(
        youtube_service=mock_youtube,
        cache_repo=mock_cache_repo,
        groq_client=mock_groq,
    )
    graph = agent.compile()

    state = {
        "user_id": "user123",
        "topic_id": "t1",
        "topic_title": "Binary Search Trees",
        "topic_hash": compute_topic_hash("Binary Search Trees"),
        "from_cache": False,
        "raw_candidates": [],
        "ranked_resources": [],
        "error": None,
    }

    res = await graph.ainvoke(state)

    assert res["from_cache"] is False
    assert len(res["ranked_resources"]) == 2
    assert res["ranked_resources"][0]["video_id"] == "v101"
    assert res["ranked_resources"][0]["rank_score"] == 0.95
    assert res["ranked_resources"][0]["why_recommended"] == "Excellent visualization."
    mock_cache_repo.save_cached_resources.assert_called_once()
