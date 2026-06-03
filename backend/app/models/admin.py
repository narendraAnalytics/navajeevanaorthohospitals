from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TicketSummary(BaseModel):
    ticket_id: str
    customer_id: str
    customer_name: Optional[str] = None
    subject: str
    urgency: Optional[str] = None
    final_status: str
    route_decision: Optional[str] = None
    confidence_score: Optional[float] = None
    escalation_brief: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EscalationBriefResponse(BaseModel):
    ticket_id: str
    customer_id: str
    subject: str
    raw_text: str
    urgency: Optional[str] = None
    escalation_brief: Optional[str] = None
    escalation_reason: Optional[str] = None
    assigned_to: Optional[str] = None
    final_status: str
    created_at: Optional[datetime] = None


class ResolveRequest(BaseModel):
    human_reply: str = Field(..., min_length=5, description="Human staff reply to send to patient")
    resolved_by: str = Field(..., description="Staff member name or ID resolving the ticket")


class ResolveResponse(BaseModel):
    ticket_id: str
    new_status: str
    message: str
