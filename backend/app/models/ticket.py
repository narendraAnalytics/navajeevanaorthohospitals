from enum import Enum
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TicketStatus(str, Enum):
    processing = "processing"
    pending_review = "pending_review"
    approved = "approved"
    emailed = "emailed"
    auto_resolved = "auto_resolved"
    escalated = "escalated"
    escalated_to_senior = "escalated_to_senior"
    resolved = "resolved"
    error = "error"


class TicketRequest(BaseModel):
    customer_id: str = Field(..., description="Patient/customer identifier")
    subject: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)


class TicketCreateResponse(BaseModel):
    """Returned immediately after POST /ticket before agent finishes."""
    ticket_id: str
    status: TicketStatus = TicketStatus.processing


class TicketResponse(BaseModel):
    ticket_id: str
    customer_id: str
    subject: str
    status: TicketStatus
    reply_text: Optional[str] = None
    escalation_brief: Optional[str] = None
    created_at: Optional[datetime] = None


class TicketDetail(BaseModel):
    ticket_id: str
    customer_id: str
    subject: str
    description: str
    status: TicketStatus
    category: Optional[str] = None
    urgency: Optional[str] = None
    sentiment: Optional[str] = None
    reply_text: Optional[str] = None
    escalation_brief: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
