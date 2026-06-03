import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_PRO

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a medical triage AI for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
A patient ticket could not be resolved automatically and requires human staff attention.
Prepare a complete, structured escalation brief so staff can act immediately without reading the full ticket.

Your brief MUST follow this exact structure with these exact headers:

ISSUE SUMMARY
[2 sentences maximum. Plain language. What does the patient need right now?]

PATIENT HISTORY
[Relevant past visits, conditions, or medications from history. Write "No prior history on record." if none.]

SAFETY FLAGS TRIGGERED
[List each flag type and the exact words from the ticket that triggered it. If none: "No safety flags — escalated due to low AI confidence."]

SUGGESTED ACTION
[One specific, actionable recommendation for staff. Example: "Call patient to clarify insulin dosage concern and loop in duty doctor." Be specific, not vague.]

PATIENT SENTIMENT
[One word: frustrated | anxious | neutral | distressed | hopeful]

URGENCY
[Choose exactly one:]
🔴 CRITICAL — Emergency symptoms, life-threatening concern, immediate action required
🟠 HIGH     — Post-surgery issue, significant pain, wound concern, medication question
🟡 MEDIUM   — Insurance/billing dispute, report request, pre-surgery question
🟢 LOW      — General query AI could not answer, routine follow-up

Rules:
- Be concise. Staff are busy. Every word must serve a purpose.
- Never guess or infer medical diagnoses.
- Never recommend specific medications or treatments to staff.
- Never share this brief with the patient — it is internal staff use only.
- If in doubt about urgency, choose one level higher."""


def _build_patient_reply(subject: str, urgency: str) -> str:
    """Build a warm patient-facing acknowledgment. Never shown to staff — that's escalation_brief."""
    urgency_lower = (urgency or "").lower()
    subject_clean = subject.strip() if subject else "your concern"

    if urgency_lower in ("critical", "high"):
        return (
            f"Dear Patient,\n\n"
            f"Thank you for reaching out to Navajeevana Orthopedic Hospital.\n\n"
            f"We have received your concern regarding **{subject_clean}** and our staff will "
            f"immediately look into it.\n\n"
            f"**Please do not panic.** We kindly request you to visit the hospital as soon as possible. "
            f"Please bring the following with you:\n"
            f"  • Previous medical reports\n"
            f"  • X-rays (if any)\n"
            f"  • Current medicines list\n\n"
            f"Our dedicated team is available **24/7** and will be ready to attend to you the moment you arrive.\n\n"
            f"For any queries before visiting, please call us at **+91 9494559848**.\n\n"
            f"Warm regards,\n"
            f"Patient Support Team\n"
            f"Navajeevana Orthopedic Hospital, Bhimavaram"
        )
    elif urgency_lower == "medium":
        return (
            f"Dear Patient,\n\n"
            f"Thank you for reaching out to Navajeevana Orthopedic Hospital.\n\n"
            f"We have noted your query about **{subject_clean}**. "
            f"Our team will review it and get back to you shortly.\n\n"
            f"If you need immediate assistance, please call us at **+91 9494559848**.\n\n"
            f"Warm regards,\n"
            f"Patient Support Team\n"
            f"Navajeevana Orthopedic Hospital, Bhimavaram"
        )
    else:
        return (
            f"Dear Patient,\n\n"
            f"Thank you for reaching out to Navajeevana Orthopedic Hospital.\n\n"
            f"We have received your query about **{subject_clean}**. "
            f"Our team will look into it and respond soon.\n\n"
            f"For any assistance, please call us at **+91 9494559848**.\n\n"
            f"Warm regards,\n"
            f"Patient Support Team\n"
            f"Navajeevana Orthopedic Hospital, Bhimavaram"
        )


def escalation_packager(state: TicketState) -> dict:
    """Agent 7 (llm_pro): Builds complete staff escalation brief. Only runs on escalate path."""
    llm = ChatGroq(model=GROQ_MODEL_PRO, api_key=settings.GROQ_API_KEY, temperature=0)

    safety_flags = state.get("safety_flags", [])
    flag_summary = ""
    if safety_flags:
        for flag in safety_flags:
            flag_type = flag.get("flag_type", "unknown")
            words = ", ".join(flag.get("trigger_words", []))
            flag_summary += f"- {flag_type.upper()}: triggered by words [{words}]\n"
    else:
        flag_summary = "None (escalated due to low knowledge base confidence)"

    classifications = state.get("classifications", [])
    classification_info = ""
    if classifications:
        c = classifications[0]
        classification_info = (
            f"Category: {c.get('category', 'unknown')} | "
            f"Sub-category: {c.get('sub_category', 'unknown')} | "
            f"Intent: {c.get('intent', 'unknown')} | "
            f"Sentiment: {c.get('sentiment', 'unknown')}"
        )

    human_message = f"""PATIENT TICKET
Ticket ID: {state.get('ticket_id', 'N/A')}
Customer ID: {state.get('customer_id', 'N/A')}
Subject: {state.get('subject', '')}
Message: {state.get('raw_text', '')}

AI ANALYSIS
Urgency detected: {state.get('urgency', 'unknown')}
Urgency reason: {state.get('urgency_reason', '')}
{classification_info}
RAG confidence score: {state.get('confidence_score', 0.0):.2f}
Escalation reason: {state.get('escalation_reason', 'Not specified')}

SAFETY FLAGS:
{flag_summary}

PATIENT HISTORY:
{state.get('patient_history', 'No prior history on record.')}

Prepare the escalation brief now."""

    try:
        response = llm.invoke([
            ("system", SYSTEM_PROMPT),
            ("human", human_message),
        ])
        escalation_brief = response.content.strip()
    except Exception as e:
        logger.error(f"Escalation packager LLM call failed: {e}")
        escalation_brief = (
            f"ISSUE SUMMARY\n"
            f"Patient submitted a ticket requiring human review. AI escalation packaging failed.\n\n"
            f"PATIENT HISTORY\nNo prior history on record.\n\n"
            f"SAFETY FLAGS TRIGGERED\n{flag_summary}\n\n"
            f"SUGGESTED ACTION\nReview original ticket manually and contact patient.\n\n"
            f"PATIENT SENTIMENT\nneutral\n\n"
            f"URGENCY\n🟠 HIGH — Manual review required due to system issue."
        )

    patient_reply = _build_patient_reply(
        subject=state.get("subject", ""),
        urgency=state.get("urgency", "medium"),
    )

    return {
        "escalation_brief": escalation_brief,
        "reply_text": patient_reply,
        "final_status": "escalated",
        "sources_used": ["Escalation"],
    }
