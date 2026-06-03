"""HITL Review Router — Phase 4.5

Human-in-the-loop workflow. AI never emails patients directly.
Every ticket (auto_resolved or escalated) lands in this review queue first.

Staff actions:
  Approve & Send  — AI reply is correct, email sent unchanged
  Edit & Send     — staff modifies reply, then sends
  Assign to Senior Staff — ticket routed to senior, no email sent
"""
import logging
from typing import List

from fastapi import APIRouter, HTTPException

from app.database.connection import get_pool
from app.database.queries import (
    approve_ticket,
    assign_to_senior,
    get_pending_review_tickets,
    get_ticket_review_detail,
    mark_ticket_emailed,
    save_edited_reply,
)
from app.models.review import (
    ApproveRequest,
    AssignRequest,
    EditRequest,
    PendingTicket,
    ReviewActionResponse,
    TicketReviewDetail,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/review", tags=["HITL Review"])

REVIEWABLE_STATUSES = {"pending_review", "auto_resolved", "escalated"}
APPROVABLE_STATUSES = {"pending_review", "auto_resolved", "escalated"}
EMAILABLE_STATUSES = {"approved"}


async def _get_pool():
    return await get_pool()


@router.get("/pending", response_model=List[PendingTicket])
async def list_pending_tickets():
    """Return all tickets awaiting human review, oldest first."""
    pool = await _get_pool()
    rows = await get_pending_review_tickets(pool)
    return [PendingTicket(**r) for r in rows]


@router.get("/{ticket_id}", response_model=TicketReviewDetail)
async def get_ticket_for_review(ticket_id: str):
    """Return full ticket detail + AI draft + escalation brief for staff review."""
    pool = await _get_pool()
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return TicketReviewDetail(**row)


@router.patch("/{ticket_id}/approve", response_model=ReviewActionResponse)
async def approve_ticket_reply(ticket_id: str, body: ApproveRequest):
    """Approve AI reply as-is. Ticket moves to 'approved' — ready to send email."""
    pool = await _get_pool()
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    if row["final_status"] not in APPROVABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Ticket status '{row['final_status']}' cannot be approved. Must be in: {APPROVABLE_STATUSES}",
        )
    if not row.get("ai_draft"):
        raise HTTPException(
            status_code=400,
            detail="No AI draft reply found for this ticket. Cannot approve without a reply.",
        )
    await approve_ticket(pool, ticket_id, body.reviewed_by)
    logger.info(f"[HITL] Ticket {ticket_id} APPROVED by {body.reviewed_by}")
    return ReviewActionResponse(
        ticket_id=ticket_id,
        action="approved",
        new_status="approved",
        message=f"Ticket approved by {body.reviewed_by}. Use POST /review/{ticket_id}/send-email to send.",
    )


@router.patch("/{ticket_id}/edit", response_model=ReviewActionResponse)
async def edit_and_approve_reply(ticket_id: str, body: EditRequest):
    """Submit staff-edited reply. Replaces AI draft. Ticket moves to 'approved'."""
    pool = await _get_pool()
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    if row["final_status"] not in APPROVABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Ticket status '{row['final_status']}' cannot be edited.",
        )
    await save_edited_reply(pool, ticket_id, body.edited_reply, body.reviewed_by)
    logger.info(f"[HITL] Ticket {ticket_id} EDITED by {body.reviewed_by}")
    return ReviewActionResponse(
        ticket_id=ticket_id,
        action="edited",
        new_status="approved",
        message=f"Reply edited by {body.reviewed_by}. Use POST /review/{ticket_id}/send-email to send.",
    )


@router.post("/{ticket_id}/send-email", response_model=ReviewActionResponse)
async def send_email_to_patient(ticket_id: str):
    """
    Trigger email to patient after approval. Ticket moves to 'emailed'.

    Phase 4.5: marks status 'emailed' and logs the final reply.
    Phase 5: wires real email dispatch (SMTP / Resend / SendGrid).
    """
    pool = await _get_pool()
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    if row["final_status"] not in EMAILABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Ticket must be in 'approved' status before sending email. Current: '{row['final_status']}'",
        )
    await mark_ticket_emailed(pool, ticket_id)
    customer_email = row.get("customer_email") or "not set"
    logger.info(f"[HITL] Ticket {ticket_id} EMAILED to {customer_email}")
    return ReviewActionResponse(
        ticket_id=ticket_id,
        action="emailed",
        new_status="emailed",
        message=f"Email marked as sent to patient ({customer_email}). Real dispatch wired in Phase 5.",
    )


@router.patch("/{ticket_id}/assign", response_model=ReviewActionResponse)
async def assign_ticket_to_senior(ticket_id: str, body: AssignRequest):
    """
    Assign ticket to senior staff. Ticket moves to 'escalated_to_senior'.
    No email is sent to patient.
    """
    pool = await _get_pool()
    row = await get_ticket_review_detail(pool, ticket_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    if row["final_status"] in ("emailed", "escalated_to_senior"):
        raise HTTPException(
            status_code=400,
            detail=f"Ticket already in final state: '{row['final_status']}'",
        )
    await assign_to_senior(pool, ticket_id, body.assigned_to, body.reviewed_by)
    logger.info(
        f"[HITL] Ticket {ticket_id} ASSIGNED to {body.assigned_to} by {body.reviewed_by}"
    )
    return ReviewActionResponse(
        ticket_id=ticket_id,
        action="assigned_to_senior",
        new_status="escalated_to_senior",
        message=f"Ticket assigned to {body.assigned_to} by {body.reviewed_by}. No email sent to patient.",
    )
