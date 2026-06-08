import json
import logging
from datetime import datetime, timezone

from langchain_groq import ChatGroq
from langgraph.store.base import BaseStore

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the intake coordinator AI for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Your job is to read a patient's support ticket and their history, then determine urgency level.

Urgency rules — pick exactly one level:
- critical : emergency words, severe pain, can't walk, chest pain, unconscious, collapse, ambulance
- high     : post-surgery concerns, wound issues, significant pain, medication questions, fever after surgery
- medium   : appointment requests, test preparation queries, report requests, insurance questions
- low      : general inquiries, billing questions, OPD timings, general information

Return ONLY valid JSON. No explanation, no markdown:
{"urgency": "medium", "urgency_reason": "Patient asking about OPD appointment timings"}

Rules:
- Never include medical advice or diagnosis in your response.
- Never speculate about what the patient's condition might be.
- When uncertain between two levels, always choose the higher urgency.
- Base decision solely on the ticket content and patient history provided."""


async def orchestrator(state: TicketState, store: BaseStore) -> dict:
    """Agent 1: Reads patient long-term history, detects urgency. Results shared with all downstream agents."""
    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)

    # Read long-term patient history from AsyncPostgresStore
    customer_id = state.get("customer_id", "unknown")
    patient_history = ""
    try:
        namespace = ("patient", customer_id.replace(".", "_").replace("@", "_AT_"))
        result = await store.aget(namespace, "medical_history")
        if result:
            facts = result.value.get("facts", [])
            if facts:
                patient_history = "Prior patient history: " + "; ".join(facts)
                logger.info(f"[Orchestrator] Loaded {len(facts)} facts for {customer_id}")
    except Exception as e:
        logger.warning(f"[Orchestrator] Could not read patient history: {e}. Continuing without it.")

    ticket_context = f"""PATIENT TICKET
Subject: {state.get('subject', '')}
Message: {state.get('raw_text', '')}

PATIENT HISTORY (from previous visits):
{patient_history if patient_history else 'No prior history on record.'}"""

    try:
        response = llm.invoke([
            ("system", SYSTEM_PROMPT),
            ("human", ticket_context),
        ])
        parsed = json.loads(response.content.strip())
        urgency = parsed.get("urgency", "medium")
        urgency_reason = parsed.get("urgency_reason", "")
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Orchestrator JSON parse failed: {e}. Defaulting to medium urgency.")
        urgency = "medium"
        urgency_reason = "Auto-assigned: could not parse urgency from ticket"

    if urgency not in ("critical", "high", "medium", "low"):
        urgency = "medium"

    return {
        "urgency": urgency,
        "urgency_reason": urgency_reason,
        "patient_history": patient_history,
        "processing_started_at": datetime.now(timezone.utc).isoformat(),
    }
