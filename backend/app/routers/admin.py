"""Admin router — staff-facing management endpoints."""
import logging
from typing import List

from fastapi import APIRouter, HTTPException, Request

from app.database.queries import get_all_tickets, get_escalation_brief, resolve_ticket
from app.models.admin import EscalationBriefResponse, ResolveRequest, ResolveResponse, TicketSummary

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"])


@router.get("/tickets/all", response_model=List[TicketSummary])
async def list_all_tickets(request: Request):
    """Return all tickets across all statuses, newest first."""
    pool = request.app.state.pool
    rows = await get_all_tickets(pool)
    return [TicketSummary(**r) for r in rows]


@router.get("/ticket/{ticket_id}/brief", response_model=EscalationBriefResponse)
async def get_ticket_brief(ticket_id: str, request: Request):
    """Return escalation brief + full context for a specific ticket."""
    pool = request.app.state.pool
    row = await get_escalation_brief(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return EscalationBriefResponse(**row)


@router.patch("/ticket/{ticket_id}/resolve", response_model=ResolveResponse)
async def resolve_ticket_endpoint(ticket_id: str, body: ResolveRequest, request: Request):
    """Mark ticket resolved with a human-written reply. Sets status to 'resolved'."""
    pool = request.app.state.pool
    row = await get_escalation_brief(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    if row["final_status"] in ("resolved", "emailed"):
        raise HTTPException(
            status_code=400,
            detail=f"Ticket already in final state: '{row['final_status']}'",
        )
    await resolve_ticket(pool, ticket_id, body.human_reply, body.resolved_by)
    logger.info(f"[Admin] Ticket {ticket_id} RESOLVED by {body.resolved_by}")
    return ResolveResponse(
        ticket_id=ticket_id,
        new_status="resolved",
        message=f"Ticket resolved by {body.resolved_by}.",
    )
