import operator
from typing import TypedDict, Optional, List, Annotated


class TicketState(TypedDict):
    # Input — set by API before graph runs
    ticket_id: str
    customer_id: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    raw_text: str
    subject: str

    # Set by Orchestrator
    urgency: str                          # critical|high|medium|low
    patient_history: str                  # from long-term memory
    processing_started_at: Optional[str]

    # Parallel branch outputs — operator.add reducer = safe concurrent writes from 3 agents
    classifications: Annotated[List[dict], operator.add]
    safety_flags: Annotated[List[dict], operator.add]
    rag_results: Annotated[List[dict], operator.add]

    # Set by Confidence Evaluator (fan-in)
    confidence_score: Optional[float]
    route_decision: Optional[str]         # auto_reply|web_search|web_reply|escalate
    escalation_reason: Optional[str]

    # Set by Tavily Search (web_search path only)
    web_results: Optional[List[dict]]     # [{url, content, score}]

    # Set by Reply Writer or Escalation Packager
    reply_text: Optional[str]
    escalation_brief: Optional[str]
    final_status: Optional[str]           # auto_resolved|escalated

    # Tracking
    sources_used: Optional[List[str]]     # KB|Tavily|Escalation
    conversation_turns: Optional[int]
    error_message: Optional[str]
