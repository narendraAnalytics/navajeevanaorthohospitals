import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agent.graph import build_graph
from app.agent.appointment_graph import build_appointment_graph
from app.config import settings
from app.database.connection import checkpointer_cm, store_cm
from app.database.init_db import init_db
from app.routers import admin, review, tickets
from app.routers import appointments

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Startup] Initialising database...")
    app.state.pool = await init_db()
    logger.info("[Startup] Building production graph...")
    async with checkpointer_cm() as checkpointer:
        await checkpointer.setup()
        async with store_cm() as store:
            await store.setup()
            app.state.graph = build_graph(checkpointer=checkpointer, store=store)
            app.state.appointment_graph = build_appointment_graph(checkpointer=checkpointer, store=store)
            logger.info("[Startup] OrthoAI ready.")
            yield
    await app.state.pool.close()
    logger.info("[Shutdown] Pool closed.")


app = FastAPI(
    title="OrthoAI — Navajeevana Orthopedic Hospital",
    description="AI-powered patient support agent. Staff review all replies before sending.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(admin.router)
app.include_router(review.router)
app.include_router(appointments.router)


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "llm_provider": "groq", "env": settings.APP_ENV}
