"""Task queue abstraction. Thin wrapper around arq so route/service code
doesn't import arq directly — easier to swap (or mock in tests)."""

from __future__ import annotations

from typing import Any, Protocol

from arq.connections import ArqRedis, RedisSettings, create_pool


class TaskQueue(Protocol):
    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None: ...


class ArqTaskQueue:
    def __init__(self, pool: ArqRedis) -> None:
        self._pool = pool

    async def enqueue(self, function_name: str, *args: Any, **kwargs: Any) -> str | None:
        job = await self._pool.enqueue_job(function_name, *args, **kwargs)
        return job.job_id if job else None

    async def aclose(self) -> None:
        await self._pool.aclose()


async def make_arq_pool(redis_url: str) -> ArqRedis:
    return await create_pool(RedisSettings.from_dsn(redis_url))
