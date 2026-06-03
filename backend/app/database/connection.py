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
        _pool = await asyncpg.create_pool(settings.NEON_DB_URL)
        logger.info("[DB] asyncpg pool created")
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("[DB] asyncpg pool closed")


async def create_checkpointer() -> AsyncPostgresSaver:
    """LangGraph short-term memory: per-ticket thread state in Neon PostgreSQL."""
    saver = await AsyncPostgresSaver.afrom_conn_string(settings.NEON_DB_URL)
    await saver.setup()
    logger.info("[DB] AsyncPostgresSaver ready")
    return saver


async def create_store() -> AsyncPostgresStore:
    """LangGraph long-term memory: per-patient facts across all tickets."""
    store = await AsyncPostgresStore.afrom_conn_string(settings.NEON_DB_URL)
    await store.setup()
    logger.info("[DB] AsyncPostgresStore ready")
    return store
