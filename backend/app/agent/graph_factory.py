"""Production graph builder.

Called once at FastAPI startup (Phase 5 lifespan). Returns a compiled
LangGraph with real AsyncPostgresSaver checkpointer and AsyncPostgresStore.
"""
import logging

from app.agent.graph import build_graph
from app.database.connection import create_checkpointer, create_store

logger = logging.getLogger(__name__)


async def build_production_graph():
    """Build the 8-agent graph wired to Neon PostgreSQL memory."""
    checkpointer = await create_checkpointer()
    store = await create_store()
    graph = build_graph(checkpointer=checkpointer, store=store)
    logger.info("[Graph] Production graph compiled with PostgresSaver + AsyncPostgresStore")
    return graph
