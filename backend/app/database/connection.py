import logging

import asyncpg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres import AsyncPostgresStore

from app.config import settings

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.NEON_DB_URL,
            min_size=1,
            max_size=5,
            timeout=30,           # fail fast if Neon doesn't respond in 30s
            command_timeout=60,   # per-query timeout
        )
        logger.info("[DB] asyncpg pool created")
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("[DB] asyncpg pool closed")


def checkpointer_cm():
    """Return context manager for AsyncPostgresSaver. Enter in FastAPI lifespan."""
    return AsyncPostgresSaver.from_conn_string(settings.NEON_DB_URL)


def store_cm():
    """Return context manager for AsyncPostgresStore. Enter in FastAPI lifespan."""
    return AsyncPostgresStore.from_conn_string(settings.NEON_DB_URL)
