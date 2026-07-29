from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_SEED_CHANNELS_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_channels.json"


def parse_iso8601_duration(duration_str: str) -> str:
    """Converts ISO 8601 duration string (e.g. PT14M33S or PT1H2M) into readable MM:SS or HH:MM:SS format."""
    if not duration_str or not duration_str.startswith("P"):
        return "N/A"

    match = re.search(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str)
    if not match:
        return "N/A"

    hours, minutes, seconds = match.groups()
    h = int(hours) if hours else 0
    m = int(minutes) if minutes else 0
    s = int(seconds) if seconds else 0

    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def load_seed_channels() -> list[dict[str, Any]]:
    """Loads trusted seed channels from dataset."""
    if _SEED_CHANNELS_PATH.is_file():
        try:
            return json.loads(_SEED_CHANNELS_PATH.read_text(encoding="utf-8"))
        except Exception as err:
            logger.warning("Failed to parse seed_channels.json: %s", err)
    return []


class YouTubeService:
    def __init__(self, api_key: str | None = None) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.youtube_api_key
        self.seed_channels = load_seed_channels()

    async def search_educational_videos(
        self, query: str, max_results: int = 8
    ) -> list[dict[str, Any]]:
        """Searches YouTube for educational videos matching topic query.
        Falls back to mock/seed datasets if API key is absent or request fails.
        """
        if not self.api_key:
            logger.info("YOUTUBE_API_KEY missing. Using seed mock dataset for query: %s", query)
            return self._generate_mock_results(query, max_results)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Search videos
                search_url = "https://www.googleapis.com/youtube/v3/search"
                search_params = {
                    "part": "snippet",
                    "q": f"{query} tutorial lecture computer science",
                    "type": "video",
                    "videoEmbeddable": "true",
                    "maxResults": max_results,
                    "key": self.api_key,
                }
                res = await client.get(search_url, params=search_params)
                res.raise_for_status()
                search_data = res.json()

                items = search_data.get("items", [])
                if not items:
                    return self._generate_mock_results(query, max_results)

                video_ids = [
                    item["id"]["videoId"] for item in items if "videoId" in item.get("id", {})
                ]
                if not video_ids:
                    return self._generate_mock_results(query, max_results)

                # Fetch video details for durations & stats
                details_url = "https://www.googleapis.com/youtube/v3/videos"
                details_params = {
                    "part": "contentDetails,statistics",
                    "id": ",".join(video_ids),
                    "key": self.api_key,
                }
                details_res = await client.get(details_url, params=details_params)
                details_res.raise_for_status()
                details_data = details_res.json()

                details_map = {v["id"]: v for v in details_data.get("items", [])}

                results: list[dict[str, Any]] = []
                for item in items:
                    v_id = item["id"].get("videoId")
                    if not v_id:
                        continue

                    snippet = item.get("snippet", {})
                    v_details = details_map.get(v_id, {})
                    content_details = v_details.get("contentDetails", {})
                    statistics = v_details.get("statistics", {})

                    duration_raw = content_details.get("duration", "")
                    duration_formatted = parse_iso8601_duration(duration_raw)

                    results.append(
                        {
                            "video_id": v_id,
                            "title": snippet.get("title", ""),
                            "url": f"https://www.youtube.com/watch?v={v_id}",
                            "channel_title": snippet.get("channelTitle", "Educator Channel"),
                            "thumbnail_url": snippet.get("thumbnails", {})
                            .get("high", {})
                            .get("url")
                            or f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg",
                            "duration": duration_formatted,
                            "publication_date": snippet.get("publishedAt", ""),
                            "view_count": int(statistics.get("viewCount", 0)),
                            "description": snippet.get("description", ""),
                        }
                    )

                return results
        except Exception as err:
            logger.error("YouTube API request failed for query '%s': %s", query, err)
            return self._generate_mock_results(query, max_results)

    def _generate_mock_results(self, query: str, max_results: int) -> list[dict[str, Any]]:
        """Generates realistic mock video results for testing & offline mode."""
        seed_names = [ch["name"] for ch in self.seed_channels] or [
            "3Blue1Brown",
            "Computerphile",
            "freeCodeCamp.org",
            "Neso Academy",
            "MIT OpenCourseWare",
        ]

        mock_results: list[dict[str, Any]] = []
        clean_query = query.strip()
        for idx in range(min(max_results, 5)):
            channel = seed_names[idx % len(seed_names)]
            v_id = f"mock_{abs(hash(clean_query + str(idx))) % 1000000:06d}"
            mock_results.append(
                {
                    "video_id": v_id,
                    "title": f"Understanding {clean_query} — Complete Guide & Visual Intuition",
                    "url": f"https://www.youtube.com/watch?v={v_id}",
                    "channel_title": channel,
                    "thumbnail_url": f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg",
                    "duration": f"{(idx + 1) * 8 + 4}:15",
                    "publication_date": "2024-01-15T00:00:00Z",
                    "view_count": 125000 + idx * 45000,
                    "description": f"A comprehensive tutorial explaining {clean_query} core concepts, algorithms, and practical examples.",
                }
            )

        return mock_results
