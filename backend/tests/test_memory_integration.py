"""
Memory integration tests — requires real Neon DB + Groq API.
Proves that patient facts written by memory_manager in Ticket 1
are read back by orchestrator in Ticket 2 (same customer_id).

Run: python -m pytest tests/test_memory_integration.py -v -s
"""
import os
import sys
import pytest
from app.agent.graph_factory import build_production_graph


def _safe_print(text: str) -> None:
    safe = text.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
        sys.stdout.encoding or "utf-8"
    )
    print(safe)


SKIP_IF_NO_KEYS = pytest.mark.skipif(
    not os.environ.get("GROQ_API_KEY") or not os.environ.get("NEON_DB_URL"),
    reason="GROQ_API_KEY or NEON_DB_URL not set in .env"
)


def _state(subject: str, raw_text: str, customer_id: str, ticket_id: str) -> dict:
    return {
        "ticket_id": ticket_id,
        "customer_id": customer_id,
        "subject": subject,
        "raw_text": raw_text,
        "classifications": [],
        "safety_flags": [],
        "rag_results": [],
    }


@SKIP_IF_NO_KEYS
async def test_patient_history_persists_across_tickets():
    """
    Ticket 1 — patient mentions 'insulin daily for diabetes'.
    Ticket 2 — same customer, different question.
    Orchestrator in Ticket 2 should have patient_history from Ticket 1.
    """
    graph = await build_production_graph()
    customer_id = "CUST-MEM-TEST-001"

    # Ticket 1: contains a medical fact (insulin / diabetes)
    state1 = _state(
        subject="Pre-surgery question",
        raw_text="I take insulin daily for diabetes. Can I eat before my knee surgery tomorrow?",
        customer_id=customer_id,
        ticket_id="TICKET-MEM-001",
    )
    result1 = await graph.ainvoke(
        state1,
        config={"configurable": {"thread_id": "TICKET-MEM-001"}},
    )

    _safe_print(f"\n{'='*60}")
    _safe_print("TICKET 1 — Memory Write")
    _safe_print(f"Route:  {result1.get('route_decision')}")
    _safe_print(f"Status: {result1.get('final_status')}")
    _safe_print(f"{'='*60}\n")

    # Ticket 2: same customer, different question
    state2 = _state(
        subject="Follow-up appointment",
        raw_text="I had my surgery yesterday. When should I come for the follow-up check?",
        customer_id=customer_id,
        ticket_id="TICKET-MEM-002",
    )
    result2 = await graph.ainvoke(
        state2,
        config={"configurable": {"thread_id": "TICKET-MEM-002"}},
    )

    patient_history = result2.get("patient_history", "")
    _safe_print(f"\n{'='*60}")
    _safe_print("TICKET 2 — Memory Read")
    _safe_print(f"patient_history: {patient_history}")
    _safe_print(f"Route:  {result2.get('route_decision')}")
    _safe_print(f"Status: {result2.get('final_status')}")
    _safe_print(f"{'='*60}\n")

    assert "insulin" in patient_history.lower(), (
        f"Expected 'insulin' in patient_history from prior ticket, got: '{patient_history}'"
    )


@SKIP_IF_NO_KEYS
async def test_db_tables_created():
    """Verify init_db creates all 4 application tables in Neon."""
    from app.database.init_db import init_db

    pool = await init_db()

    async with pool.acquire() as conn:
        tables = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        )
        table_names = {row["tablename"] for row in tables}

    expected = {"tickets", "replies", "escalations", "agent_logs"}
    missing = expected - table_names
    assert not missing, f"Missing tables in Neon DB: {missing}"
    _safe_print(f"\nAll 4 app tables confirmed in Neon: {expected}")
