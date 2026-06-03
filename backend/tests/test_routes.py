"""Route-level tests — no real Neon DB or Groq API calls.

Pool and graph are mocked on app.state so all tests run offline.
asyncio_mode = "auto" is set in pyproject.toml — no @pytest.mark.asyncio needed.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def mock_pool():
    pool = MagicMock()
    pool.execute = AsyncMock()
    pool.fetch = AsyncMock(return_value=[])
    pool.fetchrow = AsyncMock(return_value=None)
    pool.close = AsyncMock()
    return pool


@pytest.fixture
def mock_graph():
    graph = MagicMock()
    graph.ainvoke = AsyncMock(return_value={
        "reply_text": "Test reply from AI.",
        "final_status": "pending_review",
        "route_decision": "auto_reply",
        "urgency": "low",
        "confidence_score": 0.9,
        "escalation_brief": None,
        "escalation_reason": None,
        "classifications": [{"category": "appointment", "sentiment": "neutral"}],
    })
    return graph


@pytest.fixture
async def client(mock_pool, mock_graph):
    app.state.pool = mock_pool
    app.state.graph = mock_graph
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ── Health ────────────────────────────────────────────────────────────────────

async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "llm_provider" in data


# ── POST /ticket ──────────────────────────────────────────────────────────────

async def test_post_ticket_returns_202(client, mock_pool):
    resp = await client.post("/ticket", json={
        "customer_id": "CUST-001",
        "subject": "Knee pain after surgery",
        "description": "I have severe knee pain and swelling since yesterday evening.",
    })
    assert resp.status_code == 202
    data = resp.json()
    assert "ticket_id" in data
    assert data["ticket_id"].startswith("TICKET-")
    assert data["status"] == "processing"


async def test_post_ticket_missing_fields(client):
    resp = await client.post("/ticket", json={"customer_id": "CUST-001"})
    assert resp.status_code == 422


async def test_post_ticket_description_too_short(client):
    resp = await client.post("/ticket", json={
        "customer_id": "C1",
        "subject": "Pain",
        "description": "ow",
    })
    assert resp.status_code == 422


# ── GET /ticket/{id} ──────────────────────────────────────────────────────────

async def test_get_ticket_not_found(client, mock_pool):
    mock_pool.fetchrow = AsyncMock(return_value=None)
    resp = await client.get("/ticket/TICKET-DOESNOTEXIST")
    assert resp.status_code == 404


async def test_get_ticket_found(client, mock_pool):
    from asyncpg import Record
    import asyncpg

    fake_row = {
        "id": "TICKET-ABC123",
        "customer_id": "CUST-001",
        "subject": "Knee pain",
        "raw_text": "I have knee pain.",
        "final_status": "pending_review",
        "category": "post_surgery_care",
        "urgency": "medium",
        "sentiment": "neutral",
        "confidence_score": 0.87,
        "route_decision": "auto_reply",
        "customer_name": None,
        "customer_email": None,
        "reviewed_by": None,
        "created_at": None,
        "updated_at": None,
        "ai_draft": "Here is the AI reply.",
        "reply_type": "ai_draft",
        "escalation_brief": None,
        "escalation_reason": None,
        "assigned_to": None,
    }
    mock_pool.fetchrow = AsyncMock(return_value=fake_row)
    resp = await client.get("/ticket/TICKET-ABC123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ticket_id"] == "TICKET-ABC123"
    assert data["status"] == "pending_review"


# ── GET /tickets/all (admin) ──────────────────────────────────────────────────

async def test_get_all_tickets_empty(client, mock_pool):
    mock_pool.fetch = AsyncMock(return_value=[])
    resp = await client.get("/tickets/all")
    assert resp.status_code == 200
    assert resp.json() == []


# ── GET /review/pending ───────────────────────────────────────────────────────

async def test_get_pending_review_empty(client, mock_pool):
    mock_pool.fetch = AsyncMock(return_value=[])
    resp = await client.get("/review/pending")
    assert resp.status_code == 200
    assert resp.json() == []


# ── GET /review/{ticket_id} ───────────────────────────────────────────────────

async def test_get_review_ticket_not_found(client, mock_pool):
    mock_pool.fetchrow = AsyncMock(return_value=None)
    resp = await client.get("/review/TICKET-MISSING")
    assert resp.status_code == 404


# ── PATCH /review/{id}/approve — validation ───────────────────────────────────

async def test_approve_requires_reviewed_by(client):
    resp = await client.patch("/review/TICKET-XYZ/approve", json={})
    assert resp.status_code == 422
