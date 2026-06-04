"""Ticket router — patient-facing endpoints.

POST /ticket  — submit a new ticket; graph runs in background, returns ticket_id immediately
GET  /ticket/{id} — poll for result
"""
import logging
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from app.database.queries import (
    get_ticket_review_detail,
    get_tickets_by_email,
    save_escalation,
    save_reply,
    save_ticket,
    update_ticket_status,
)
from app.models.ticket import TicketCreateResponse, TicketDetail, TicketRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Tickets"])


async def _run_graph(pool, graph, ticket_id: str, state: dict) -> None:
    """Background task: invoke LangGraph, persist results to DB."""
    try:
        result = await graph.ainvoke(
            state,
            config={"configurable": {"thread_id": ticket_id}},
        )
        final_status = result.get("final_status") or "pending_review"
        await update_ticket_status(
            pool,
            ticket_id,
            urgency=result.get("urgency"),
            category=result.get("classifications", [{}])[0].get("category") if result.get("classifications") else None,
            sentiment=result.get("classifications", [{}])[0].get("sentiment") if result.get("classifications") else None,
            confidence_score=result.get("confidence_score"),
            route_decision=result.get("route_decision"),
            final_status="pending_review",
        )
        if result.get("reply_text"):
            await save_reply(pool, ticket_id, result["reply_text"], reply_type="ai_draft", sent_by="ai")
        if result.get("escalation_brief"):
            await save_escalation(
                pool,
                ticket_id,
                brief=result["escalation_brief"],
                reason=result.get("escalation_reason") or "",
            )
        logger.info(f"[Graph] Ticket {ticket_id} done — status=pending_review, route={result.get('route_decision')}")
    except Exception as exc:
        logger.error(f"[Graph] Ticket {ticket_id} failed: {exc}", exc_info=True)
        await update_ticket_status(pool, ticket_id, final_status="error")


@router.post("/ticket", response_model=TicketCreateResponse, status_code=202, tags=["Tickets"])
async def submit_ticket(body: TicketRequest, background_tasks: BackgroundTasks, request: Request):
    """Submit a patient support ticket. Graph runs in background — poll GET /ticket/{id} for result."""
    pool = request.app.state.pool
    graph = request.app.state.graph

    ticket_id = f"TICKET-{uuid4().hex[:8].upper()}"
    customer_id = body.customer_email
    subject = body.message[:60] + ("…" if len(body.message) > 60 else "")

    await save_ticket(
        pool, ticket_id, customer_id, subject, body.message,
        customer_name=body.customer_name,
        customer_email=body.customer_email,
        customer_phone=body.customer_phone,
    )

    state = {
        "ticket_id": ticket_id,
        "customer_id": customer_id,
        "customer_name": body.customer_name,
        "customer_email": body.customer_email,
        "subject": subject,
        "raw_text": body.message,
        "patient_history": "",
        "urgency": None,
        "processing_started_at": None,
        "classifications": [],
        "safety_flags": [],
        "rag_results": [],
        "confidence_score": None,
        "route_decision": None,
        "escalation_reason": None,
        "web_results": None,
        "reply_text": None,
        "escalation_brief": None,
        "final_status": None,
        "sources_used": None,
        "conversation_turns": None,
        "error_message": None,
    }

    background_tasks.add_task(_run_graph, pool, graph, ticket_id, state)
    logger.info(f"[Ticket] Submitted {ticket_id} for customer {customer_id}")

    return TicketCreateResponse(ticket_id=ticket_id)


@router.get("/tickets/by-email/{email}", tags=["Tickets"])
async def get_tickets_by_email_route(email: str, request: Request):
    """Return all tickets for a patient email, newest first."""
    pool = request.app.state.pool
    rows = await get_tickets_by_email(pool, email)
    return rows


@router.get("/ticket/{ticket_id}", response_model=TicketDetail, tags=["Tickets"])
async def get_ticket(ticket_id: str, request: Request):
    """Get ticket status and AI reply. Poll until final_status != 'processing'."""
    pool = request.app.state.pool
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return TicketDetail(
        ticket_id=row["ticket_id"],
        customer_id=row["customer_id"],
        subject=row["subject"],
        description=row.get("raw_text") or "",
        status=row.get("final_status") or "processing",
        category=row.get("category"),
        urgency=row.get("urgency"),
        sentiment=row.get("sentiment"),
        confidence_score=row.get("confidence_score"),
        route_decision=row.get("route_decision"),
        reply_text=row.get("ai_draft"),
        escalation_brief=row.get("escalation_brief"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )
