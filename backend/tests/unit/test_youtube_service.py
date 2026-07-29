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

    assert len(results) == 5
    for item in results:
        assert "video_id" in item
        assert "title" in item
        assert "url" in item
        assert "channel_title" in item
        assert item["url"].startswith("https://www.youtube.com/watch?v=")
