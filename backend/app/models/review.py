from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PendingTicket(BaseModel):
    ticket_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    subject: str
    urgency: Optional[str] = None
    confidence_score: Optional[float] = None
    route_decision: Optional[str] = None
    final_status: str
    ai_draft: Optional[str] = None
    escalation_brief: Optional[str] = None
    created_at: Optional[datetime] = None


class TicketReviewDetail(BaseModel):
    ticket_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    subject: str
    raw_text: str
    urgency: Optional[str] = None
    category: Optional[str] = None
    sentiment: Optional[str] = None
    confidence_score: Optional[float] = None
    route_decision: Optional[str] = None
    final_status: str
    ai_draft: Optional[str] = None
    escalation_brief: Optional[str] = None
    escalation_reason: Optional[str] = None
    assigned_to: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ApproveRequest(BaseModel):
    reviewed_by: str = Field(..., description="Staff member name or ID approving the reply")


class EditRequest(BaseModel):
    edited_reply: str = Field(..., min_length=10, description="Staff-edited reply text")
    reviewed_by: str = Field(..., description="Staff member name or ID editing the reply")


class AssignRequest(BaseModel):
    assigned_to: str = Field(..., description="Senior staff member name or ID to assign to")
    reviewed_by: str = Field(..., description="Staff member name or ID making the assignment")


class ReviewActionResponse(BaseModel):
    ticket_id: str
    action: str
    new_status: str
    message: str
