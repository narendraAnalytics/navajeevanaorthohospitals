"""Ticket router — patient-facing endpoints.

POST /ticket          — submit ticket; graph runs in background
GET  /ticket/{id}     — poll for result
GET  /ticket/{id}/logs — agent execution progress (for live pipeline view)
"""
import logging
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from app.database.queries import (
    get_agent_logs,
    get_ticket_review_detail,
    get_tickets_by_email,
    log_agent_decision,
    save_escalation,
    save_reply,
    save_ticket,
    update_ticket_status,
)
from app.models.ticket import TicketCreateResponse, TicketDetail, TicketRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Tickets"])

_NODE_NAMES = {
    "orchestrator", "intent_classifier", "safety_checker", "rag_retriever",
    "confidence_evaluator", "tavily_search", "reply_writer",
    "escalation_packager", "memory_manager",
}


def _node_decision(node: str, output: dict) -> str:
    """Extract a human-readable decision string from a node's output dict."""
    if node == "orchestrator":
        return str(output.get("urgency") or "unknown")
    if node == "intent_classifier":
        clsf = output.get("classifications") or []
        return clsf[0].get("category", "unknown") if clsf else "unknown"
    if node == "safety_checker":
        flags = output.get("safety_flags") or []
        return f"flagged:{len(flags)}" if flags else "safe"
    if node == "rag_retriever":
        results = output.get("rag_results") or []
        if results:
            best = max((r.get("similarity_score", 0) for r in results), default=0)
            return f"score:{best:.2f}"
        return "no_results"
    if node == "confidence_evaluator":
        return str(output.get("route_decision") or "unknown")
    if node == "tavily_search":
        return str(output.get("route_decision") or "searched")
    if node == "reply_writer":
        return str(output.get("final_status") or "drafted")
    if node == "escalation_packager":
        return "escalated"
    if node == "memory_manager":
        return "stored"
    return "done"


async def _run_graph(pool, graph, ticket_id: str, state: dict) -> None:
    """Background task: stream LangGraph events, log each node, persist results."""
    try:
        config = {"configurable": {"thread_id": ticket_id}}

        # Stream node-level updates so we can write agent_logs in real time
        async for chunk in graph.astream(state, config=config, stream_mode="updates"):
            for node_name, output in chunk.items():
                if node_name in _NODE_NAMES and isinstance(output, dict):
                    decision = _node_decision(node_name, output)
                    confidence = output.get("confidence_score")
                    try:
                        await log_agent_decision(
                            pool, ticket_id, node_name, decision, confidence, None, None
                        )
                    except Exception as log_err:
                        logger.warning(f"[Graph] Log write failed for {node_name}: {log_err}")

        # Read final accumulated state from checkpointer
        snapshot = await graph.aget_state(config)
        result: dict = dict(snapshot.values) if snapshot and snapshot.values else {}

        await update_ticket_status(
            pool,
            ticket_id,
            urgency=result.get("urgency"),
            category=(result.get("classifications") or [{}])[0].get("category") if result.get("classifications") else None,
            sentiment=(result.get("classifications") or [{}])[0].get("sentiment") if result.get("classifications") else None,
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
        logger.info(f"[Graph] Ticket {ticket_id} done — route={result.get('route_decision')}")
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


@router.get("/ticket/{ticket_id}/logs", tags=["Tickets"])
async def get_ticket_logs(ticket_id: str, request: Request):
    """Return agent execution logs for live pipeline view. Poll until status != 'processing'."""
    pool = request.app.state.pool
    logs = await get_agent_logs(pool, ticket_id)
    row = await get_ticket_review_detail(pool, ticket_id)
    return {
        "ticket_id": ticket_id,
        "status": row.get("final_status") or "processing" if row else "processing",
        "route_decision": row.get("route_decision") if row else None,
        "confidence_score": row.get("confidence_score") if row else None,
        "logs": [
            {
                "node_name": r["node_name"],
                "decision": r["decision"],
                "confidence_score": r["confidence_score"],
                "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
            }
            for r in logs
        ],
    }


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
