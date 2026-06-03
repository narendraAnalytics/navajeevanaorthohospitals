import asyncio
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
        # Neon free tier sleeps after inactivity — retry up to 3 times.
        # First attempt wakes Neon (times out after 30s), second attempt succeeds.
        for attempt in range(1, 4):
            try:
                _pool = await asyncpg.create_pool(
                    settings.NEON_DB_URL,
                    min_size=1,
                    max_size=5,
                    timeout=30,
                    command_timeout=60,
                )
                logger.info("[DB] asyncpg pool created")
                break
            except Exception as e:
                if attempt < 3:
                    logger.warning(f"[DB] Pool attempt {attempt}/3 failed: {e}. Retrying in 5s...")
                    await asyncio.sleep(5)
                else:
                    logger.error("[DB] All 3 pool attempts failed. Is NEON_DB_URL correct?")
                    raise
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
