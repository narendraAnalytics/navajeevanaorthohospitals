import json
import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a medical record extraction AI for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Extract factual patient information from the ticket — only what the patient explicitly stated.

Extract only if directly mentioned by the patient:
- Medical conditions (knee pain, hip fracture, diabetes, hypertension, etc.)
- Medications currently taking (any drug names)
- Recent or upcoming procedures (surgery type, scheduled date if given)
- Allergies explicitly stated
- Specific follow-up concerns they raised

Do NOT infer, assume, or guess. Only extract what is written.

Return ONLY valid JSON:
{"facts": ["takes metformin daily", "knee replacement surgery 3 days ago", "allergic to penicillin"], "empty": false}

If nothing factual is explicitly stated:
{"facts": [], "empty": true}

No explanation. No markdown. JSON only."""


def memory_manager(state: TicketState) -> dict:
    """Agent 8 (always runs last): Extracts patient facts from ticket, writes to long-term memory.

    Phase 4 will wire AsyncPostgresStore for actual DB persistence.
    Until then: extracts facts and logs them — no data loss, just not persisted to DB yet.
    """
    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)

    ticket_text = f"Subject: {state.get('subject', '')}\nMessage: {state.get('raw_text', '')}"

    try:
        response = llm.invoke([
            ("system", EXTRACTION_PROMPT),
            ("human", ticket_text),
        ])
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        extracted = json.loads(content)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"Memory manager extraction failed: {e}. Skipping memory write.")
        extracted = {"facts": [], "empty": True}

    facts = extracted.get("facts", [])
    customer_id = state.get("customer_id", "unknown")
    ticket_id = state.get("ticket_id", "unknown")

    if facts:
        logger.info(f"[MemoryManager] customer={customer_id} ticket={ticket_id} facts={facts}")
        # Phase 4: await store.aput(("patient", customer_id), "medical_history", {"facts": facts})
    else:
        logger.info(f"[MemoryManager] customer={customer_id} ticket={ticket_id} — no new facts to store")

    # Memory manager does not modify the main state — it writes to the external store.
    # Return empty dict so LangGraph sees no state mutation from this node.
    return {}
