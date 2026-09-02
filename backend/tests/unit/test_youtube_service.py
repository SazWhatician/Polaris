from __future__ import annotations

import pytest
from app.services.youtube_service import YouTubeService, parse_iso8601_duration


def test_parse_iso8601_duration():
    assert parse_iso8601_duration("PT14M33S") == "14:33"
    assert parse_iso8601_duration("PT1H2M5S") == "1:02:05"
    assert parse_iso8601_duration("PT5M") == "5:00"
    assert parse_iso8601_duration("PT45S") == "0:45"
    assert parse_iso8601_duration("") == "N/A"
    assert parse_iso8601_duration("invalid") == "N/A"


@pytest.mark.asyncio
async def test_youtube_service_fallback_mock():
    service = YouTubeService(api_key=None)
    results = await service.search_educational_videos("Binary Search Trees", max_results=5)

    assert len(results) >= 1
    for item in results:
        assert "video_id" in item
        assert "title" in item
        assert "url" in item
        assert "channel_title" in item
        assert item["url"].startswith("https://www.youtube.com/watch?v=")


@pytest.mark.asyncio
async def test_youtube_service_playlists_and_block():
    service = YouTubeService(api_key=None)
    playlists = await service.search_playlists("Binary Search Trees", max_results=3)
    assert len(playlists) >= 1
    for p in playlists:
        assert "playlist_id" in p
        assert "title" in p
        assert "url" in p
        assert "youtube.com" in p["url"]

    block_data = await service.get_block_resources(
        "Binary Search Trees", ["Insertion and Traversal", "AVL Balancing"]
    )
    assert block_data["topic_title"] == "Binary Search Trees"
    assert "playlists" in block_data
    assert "videos" in block_data
    assert "subtopics_resources" in block_data
    assert "Insertion and Traversal" in block_data["subtopics_resources"]
