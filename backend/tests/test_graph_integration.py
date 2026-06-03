"""
End-to-end integration tests for the 8-agent LangGraph graph.
Makes real Groq API calls — requires GROQ_API_KEY in .env.

Run: python -m pytest tests/test_graph_integration.py -v -s
"""
import os
import sys
import pytest
from app.agent.graph import build_graph


def _safe_print(text: str) -> None:
    """Print safely on Windows terminals that don't support full Unicode (e.g. cp1252)."""
    safe = text.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
        sys.stdout.encoding or "utf-8"
    )
    print(safe)

SKIP_IF_NO_KEY = pytest.mark.skipif(
    not os.environ.get("GROQ_API_KEY"),
    reason="GROQ_API_KEY not set in .env"
)

VALID_URGENCIES = {"critical", "high", "medium", "low"}
VALID_ROUTES = {"auto_reply", "web_search", "web_reply", "escalate"}


def _base_state(subject: str, raw_text: str, ticket_id: str = "TEST-001") -> dict:
    return {
        "ticket_id": ticket_id,
        "customer_id": "CUST-TEST-001",
        "subject": subject,
        "raw_text": raw_text,
        "classifications": [],
        "safety_flags": [],
        "rag_results": [],
    }


@SKIP_IF_NO_KEY
def test_safety_escalation_path():
    """Ticket with 'insulin' → safety flag → escalate → escalation_packager produces staff brief."""
    graph = build_graph()
    state = _base_state(
        subject="Medication question before surgery",
        raw_text="I take insulin daily for diabetes. Do I need to stop it before my knee surgery next week?",
        ticket_id="TEST-SAFETY-001",
    )

    result = graph.invoke(state)

    _safe_print(f"\n{'='*60}")
    _safe_print("TEST: Safety Escalation Path")
    _safe_print(f"Urgency: {result.get('urgency')}")
    _safe_print(f"Route:   {result.get('route_decision')}")
    _safe_print(f"Status:  {result.get('final_status')}")
    _safe_print(f"\nSafety Flags: {result.get('safety_flags')}")
    _safe_print(f"\nEscalation Brief:\n{result.get('escalation_brief')}")
    _safe_print(f"{'='*60}\n")

    assert result["final_status"] == "escalated", f"Expected escalated, got {result['final_status']}"
    assert result["escalation_brief"] is not None
    assert len(result["escalation_brief"]) > 50
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags), "Expected at least one escalation flag"
    assert result["urgency"] in VALID_URGENCIES
    assert result["route_decision"] == "escalate"


@SKIP_IF_NO_KEY
def test_auto_reply_opd_timings():
    """OPD timings query → RAG retrieves appointment_faq → auto_reply → patient reply generated."""
    graph = build_graph()
    state = _base_state(
        subject="OPD timings",
        raw_text="What are the orthopedic OPD timings? I want to visit without an appointment.",
        ticket_id="TEST-OPD-001",
    )

    result = graph.invoke(state)

    print(f"\n{'='*60}")
    print("TEST: Auto-Reply Path — OPD Timings")
    print(f"Urgency:    {result.get('urgency')}")
    print(f"Route:      {result.get('route_decision')}")
    print(f"Status:     {result.get('final_status')}")
    print(f"RAG score:  {result['rag_results'][0].get('similarity_score') if result.get('rag_results') else 'N/A'}")
    print(f"\nPatient Reply:\n{result.get('reply_text')}")
    print(f"{'='*60}\n")

    assert result["final_status"] in ("auto_resolved",), f"Got {result['final_status']}"
    assert result["reply_text"] is not None
    assert len(result["reply_text"]) > 50
    assert result["route_decision"] in VALID_ROUTES
    assert result["urgency"] in VALID_URGENCIES


@SKIP_IF_NO_KEY
def test_graph_state_fields_populated():
    """Verify all critical state fields are set after a full graph run."""
    graph = build_graph()
    state = _base_state(
        subject="Post surgery physiotherapy",
        raw_text="I had knee replacement surgery 5 days ago. When should I start physiotherapy sessions?",
        ticket_id="TEST-STATE-001",
    )

    result = graph.invoke(state)

    print(f"\n{'='*60}")
    print("TEST: State Fields Check")
    print(f"Urgency:           {result.get('urgency')}")
    print(f"Route:             {result.get('route_decision')}")
    print(f"Status:            {result.get('final_status')}")
    print(f"Classifications:   {result.get('classifications')}")
    print(f"Confidence score:  {result.get('confidence_score')}")
    print(f"Sources used:      {result.get('sources_used')}")
    reply = result.get('reply_text') or result.get('escalation_brief', '')
    print(f"\nAI Output (first 300 chars):\n{reply[:300]}")
    print(f"{'='*60}\n")

    assert result.get("urgency") in VALID_URGENCIES
    assert isinstance(result.get("classifications"), list)
    assert len(result["classifications"]) > 0
    assert result.get("route_decision") in VALID_ROUTES
    assert result.get("final_status") in ("auto_resolved", "escalated")
    assert result.get("processing_started_at") is not None
    # Either reply_text or escalation_brief must be set
    has_output = bool(result.get("reply_text")) or bool(result.get("escalation_brief"))
    assert has_output, "Graph must produce either reply_text or escalation_brief"
