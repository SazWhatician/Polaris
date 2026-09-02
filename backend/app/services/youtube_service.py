from __future__ import annotations

import asyncio
import json
import logging
import re
from pathlib import Path
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_SEED_CHANNELS_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_channels.json"

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


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


def _extract_renderers(obj: Any, target: str) -> list[dict[str, Any]]:
    """Recursively traverses YouTube initial data structure to find target renderers."""
    found: list[dict[str, Any]] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == target and isinstance(v, dict):
                found.append(v)
            else:
                found.extend(_extract_renderers(v, target))
    elif isinstance(obj, list):
        for item in obj:
            found.extend(_extract_renderers(item, target))
    return found


class YouTubeService:
    def __init__(self, api_key: str | None = None) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.youtube_api_key
        self.seed_channels = load_seed_channels()

    async def search_educational_videos(
        self, query: str, max_results: int = 8
    ) -> list[dict[str, Any]]:
        """Searches YouTube for educational videos matching topic query.
        Tries official API first; if unavailable, invalid, or quota exceeded,
        falls back to real live web search extraction before synthetic mocks.
        """
        clean_query = query.strip()
        if self.api_key:
            try:
                results = await self._search_via_api(clean_query, max_results)
                if results:
                    return results
            except Exception as err:
                logger.warning(
                    "YouTube API request failed (%s). Falling back to live web search for: %s",
                    err,
                    clean_query,
                )

        # Fallback to live YouTube search scraping for genuine videos
        scraped = await self._scrape_youtube_videos(clean_query, max_results)
        if scraped:
            return scraped

        # Offline / synthetic mock fallback
        logger.info("Using seed mock dataset for query: %s", clean_query)
        return self._generate_mock_results(clean_query, max_results)

    async def search_playlists(
        self, query: str, max_results: int = 5
    ) -> list[dict[str, Any]]:
        """Searches YouTube for full courses and curated topic playlists."""
        clean_query = query.strip()
        if self.api_key:
            try:
                playlists = await self._search_playlists_via_api(clean_query, max_results)
                if playlists:
                    return playlists
            except Exception as err:
                logger.warning(
                    "YouTube API playlist request failed (%s). Falling back to live search.",
                    err,
                )

        scraped_playlists = await self._scrape_youtube_playlists(clean_query, max_results)
        if scraped_playlists:
            return scraped_playlists

        # Mock fallback for playlists if offline
        return self._generate_mock_playlists(clean_query, max_results)

    async def get_block_resources(
        self, topic_title: str, subtopics: list[str]
    ) -> dict[str, Any]:
        """Fetches curated playlists and categorized videos for a syllabus topic block and all its subtopics."""
        # 1. Fetch playlists for the block
        # 2. Fetch main topic videos
        # 3. Concurrently fetch top videos for each subtopic
        clean_title = topic_title.strip()

        playlist_task = self.search_playlists(clean_title, max_results=4)
        main_videos_task = self.search_educational_videos(clean_title, max_results=6)

        subtopic_tasks = [
            self.search_educational_videos(f"{clean_title} {sub.strip()}", max_results=3)
            for sub in subtopics
            if sub.strip()
        ]

        all_results = await asyncio.gather(
            playlist_task, main_videos_task, *subtopic_tasks, return_exceptions=True
        )

        playlists = all_results[0] if isinstance(all_results[0], list) else []
        main_videos = all_results[1] if isinstance(all_results[1], list) else []

        subtopic_map: dict[str, list[dict[str, Any]]] = {}
        valid_subs = [s.strip() for s in subtopics if s.strip()]
        for idx, sub_name in enumerate(valid_subs):
            sub_res = all_results[2 + idx]
            if isinstance(sub_res, list):
                subtopic_map[sub_name] = sub_res
            else:
                subtopic_map[sub_name] = []

        return {
            "topic_title": clean_title,
            "playlists": playlists,
            "videos": main_videos,
            "subtopics_resources": subtopic_map,
        }

    async def _search_via_api(self, query: str, max_results: int) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=8.0) as client:
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
            video_ids = [
                item["id"]["videoId"] for item in items if "videoId" in item.get("id", {})
            ]
            if not video_ids:
                return []

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
                        "why_recommended": f"Comprehensive lecture explaining core concepts in {query}.",
                    }
                )
            return results

    async def _search_playlists_via_api(
        self, query: str, max_results: int
    ) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=8.0) as client:
            search_url = "https://www.googleapis.com/youtube/v3/search"
            params = {
                "part": "snippet",
                "q": f"{query} full course playlist computer science",
                "type": "playlist",
                "maxResults": max_results,
                "key": self.api_key,
            }
            res = await client.get(search_url, params=params)
            res.raise_for_status()
            data = res.json()

            items = data.get("items", [])
            playlists: list[dict[str, Any]] = []
            for item in items:
                p_id = item.get("id", {}).get("playlistId")
                if not p_id:
                    continue
                snippet = item.get("snippet", {})
                playlists.append(
                    {
                        "playlist_id": p_id,
                        "title": snippet.get("title", f"{query} Playlist"),
                        "channel_title": snippet.get("channelTitle", "Course Educator"),
                        "video_count": "Course Series",
                        "url": f"https://www.youtube.com/playlist?list={p_id}",
                        "thumbnail_url": snippet.get("thumbnails", {})
                        .get("high", {})
                        .get("url")
                        or f"https://i.ytimg.com/vi/{p_id}/hqdefault.jpg",
                    }
                )
            return playlists

    async def _scrape_youtube_videos(
        self, query: str, max_results: int
    ) -> list[dict[str, Any]]:
        try:
            url = "https://www.youtube.com/results"
            params = {"search_query": f"{query} tutorial computer science"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params, headers=_HEADERS)
                if res.status_code != 200:
                    return []

                m = re.search(r"var ytInitialData = ({.*?});</script>", res.text)
                if not m:
                    m = re.search(r"ytInitialData\s*=\s*({.+?});", res.text)
                if not m:
                    return []

                data = json.loads(m.group(1))
                video_renderers = _extract_renderers(data, "videoRenderer")

                results: list[dict[str, Any]] = []
                seen_ids: set[str] = set()

                for vr in video_renderers:
                    vid = vr.get("videoId")
                    if not vid or vid in seen_ids:
                        continue
                    seen_ids.add(vid)

                    title_obj = vr.get("title", {})
                    title = ""
                    if "runs" in title_obj and title_obj["runs"]:
                        title = title_obj["runs"][0].get("text", "")
                    elif "simpleText" in title_obj:
                        title = title_obj["simpleText"]

                    owner_obj = vr.get("ownerText", {})
                    channel = ""
                    if "runs" in owner_obj and owner_obj["runs"]:
                        channel = owner_obj["runs"][0].get("text", "")

                    duration = vr.get("lengthText", {}).get("simpleText", "N/A")
                    thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

                    results.append(
                        {
                            "video_id": vid,
                            "title": title,
                            "channel_title": channel or "Educator",
                            "url": f"https://www.youtube.com/watch?v={vid}",
                            "thumbnail_url": thumb,
                            "duration": duration,
                            "view_count": 0,
                            "why_recommended": f"Recommended tutorial covering key concepts in {query}.",
                        }
                    )
                    if len(results) >= max_results:
                        break

                return results
        except Exception as err:
            logger.warning("Scrape YouTube videos error for '%s': %s", query, err)
            return []

    async def _scrape_youtube_playlists(
        self, query: str, max_results: int
    ) -> list[dict[str, Any]]:
        try:
            url = "https://www.youtube.com/results"
            params = {"search_query": f"{query} course playlist", "sp": "EgIQAw=="}
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params, headers=_HEADERS)
                if res.status_code != 200:
                    return []

                m = re.search(r"var ytInitialData = ({.*?});</script>", res.text)
                if not m:
                    m = re.search(r"ytInitialData\s*=\s*({.+?});", res.text)
                if not m:
                    return []

                data = json.loads(m.group(1))
                playlists: list[dict[str, Any]] = []
                seen_pids: set[str] = set()

                lockups = _extract_renderers(data, "lockupViewModel")
                for lk in lockups:
                    cid = lk.get("contentId", "")
                    if cid.startswith("PL") or cid.startswith("VLPL"):
                        pid = cid.replace("VLPL", "PL")
                        if pid in seen_pids:
                            continue
                        seen_pids.add(pid)

                        meta = lk.get("metadata", {}).get("lockupMetadataViewModel", {})
                        title = meta.get("title", {}).get("content", "")
                        rows = meta.get("metadata", {}).get(
                            "contentMetadataViewModel", {}
                        ).get("metadataRows", [])
                        channel = ""
                        video_count = ""
                        for row in rows:
                            parts = row.get("metadataParts", [])
                            for part in parts:
                                text = part.get("text", {}).get("content", "")
                                if "video" in text.lower():
                                    video_count = text
                                elif not channel and text and text != "Playlist":
                                    channel = text

                        thumb = f"https://i.ytimg.com/vi/{pid}/hqdefault.jpg"
                        playlists.append(
                            {
                                "playlist_id": pid,
                                "title": title or f"{query} Complete Course",
                                "channel_title": channel or "Course Educator",
                                "video_count": video_count or "Series",
                                "url": f"https://www.youtube.com/playlist?list={pid}",
                                "thumbnail_url": thumb,
                            }
                        )
                        if len(playlists) >= max_results:
                            break

                return playlists
        except Exception as err:
            logger.warning("Scrape YouTube playlists error for '%s': %s", query, err)
            return []

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
                    "why_recommended": f"High-yield explainer for {clean_query}.",
                }
            )

        return mock_results

    def _generate_mock_playlists(self, query: str, max_results: int) -> list[dict[str, Any]]:
        return [
            {
                "playlist_id": f"PL_mock_{abs(hash(query + str(i))) % 100000}",
                "title": f"{query} — Complete Masterclass Playlist",
                "channel_title": "Top Tech Educator",
                "video_count": "18 videos",
                "url": f"https://www.youtube.com/results?search_query={query}+playlist",
                "thumbnail_url": "https://i.ytimg.com/vi/mock/hqdefault.jpg",
            }
            for i in range(min(max_results, 3))
        ]
