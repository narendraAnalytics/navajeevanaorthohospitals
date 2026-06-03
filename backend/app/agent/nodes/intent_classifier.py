import json
import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an intake classification AI for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Classify the patient's message with precision. Your output feeds routing and reply logic — accuracy is critical.

CATEGORIES (pick the best fit):
- appointment    : OPD booking, rescheduling, cancellation, timings, walk-in vs booked, wait times, doctor availability
- test_prep      : fasting rules before blood tests, MRI/CT/X-ray preparation, diabetic protocols, pre-surgery instructions
- report         : requesting test reports, understanding results, lab/scan/X-ray/MRI reports
- insurance      : Star Health, New India Assurance, Arogya Sri, CGHS, cashless process, reimbursement, TPA, pre-authorization
- billing        : payment queries, invoice, receipt, cost estimate, discharge bill, partial payment
- post_surgery   : recovery timeline, wound care, physiotherapy schedule, activity restrictions, pain management post-op
- medication     : any drug-related question — dosage, timing, interactions, side effects (ALWAYS needs escalation)
- emergency      : urgent/alarming symptoms, chest pain, severe uncontrolled pain, collapse, wound not healing
- general        : hospital address, parking, visiting hours, general orthopedic info, anything not in above categories

SENTIMENT options: frustrated | anxious | neutral | hopeful | distressed

Return ONLY valid JSON — no explanation, no markdown, no preamble:
{
  "category": "appointment",
  "sub_category": "OPD booking",
  "intent": "Patient wants to book a first-time OPD appointment for knee pain evaluation",
  "sentiment": "anxious",
  "keywords": ["OPD", "booking", "knee pain", "first visit"],
  "confidence": 0.93
}

Rules:
- If a message touches multiple categories, pick the one with highest patient urgency.
- medication and emergency always take priority over other categories.
- confidence must be between 0.0 and 1.0 — be honest, not artificially high."""


def intent_classifier(state: TicketState) -> dict:
    """Agent 2: Classifies ticket intent, category, sentiment. Runs in parallel with Safety Checker and RAG Retriever."""
    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)

    ticket_text = f"Subject: {state.get('subject', '')}\nMessage: {state.get('raw_text', '')}"

    try:
        response = llm.invoke([
            ("system", SYSTEM_PROMPT),
            ("human", ticket_text),
        ])
        content = response.content.strip()
        # Strip markdown code fences if model wraps JSON
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        parsed = json.loads(content)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Intent classifier parse failed: {e}. Using fallback classification.")
        parsed = {
            "category": "general",
            "sub_category": "unknown",
            "intent": "Could not classify patient intent",
            "sentiment": "neutral",
            "keywords": [],
            "confidence": 0.0,
        }

    return {"classifications": [parsed]}
