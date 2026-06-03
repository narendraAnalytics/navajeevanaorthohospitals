import logging

import asyncpg

from app.database.connection import get_pool
from app.database.schema import ALL_TABLES

logger = logging.getLogger(__name__)


async def init_db() -> asyncpg.Pool:
    """Create all app tables if they don't exist. Called once at startup."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        for sql in ALL_TABLES:
            await conn.execute(sql)
    logger.info("[DB] All app tables verified / created")
    return pool
