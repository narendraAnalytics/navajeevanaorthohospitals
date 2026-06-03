import json
import logging

from langchain_groq import ChatGroq
from langgraph.store.base import BaseStore

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


async def memory_manager(state: TicketState, store: BaseStore) -> dict:
    """Agent 8 (always runs last): Extracts patient facts, writes to long-term memory (AsyncPostgresStore)."""
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
        try:
            namespace = ("patient", customer_id)
            # Merge with existing facts to avoid overwriting prior history
            existing = await store.aget(namespace, "medical_history")
            prior_facts: list[str] = existing.value.get("facts", []) if existing else []
            merged = list(dict.fromkeys(prior_facts + facts))  # deduplicate, preserve order
            await store.aput(namespace, "medical_history", {"facts": merged})
            logger.info(f"[MemoryManager] customer={customer_id} ticket={ticket_id} stored {len(facts)} new facts ({len(merged)} total)")
        except Exception as e:
            logger.error(f"[MemoryManager] Failed to write to store: {e}")
    else:
        logger.info(f"[MemoryManager] customer={customer_id} ticket={ticket_id} — no new facts to store")

    return {}
