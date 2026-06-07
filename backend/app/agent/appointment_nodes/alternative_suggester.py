"""Alternative Suggester — llm_flash.

Called when the chosen slot is taken or hold failed.
Fetches the remaining open slots for the same day (or next working day) and
formats a friendly message for the patient.
"""
import logging
from datetime import date as date_type

from langchain_groq import ChatGroq

from app.agent.appointment_state import AppointmentState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


async def alternative_suggester(state: AppointmentState) -> dict:
    pool = await get_pool()

    appt_date = state["appointment_date"]
    if isinstance(appt_date, str):
        appt_date = date_type.fromisoformat(appt_date)

    rows = await pool.fetch(
        """SELECT id, slot_time::text, label
           FROM appointment_slots
           WHERE doctor_id = $1
             AND slot_date = $2
             AND (status = 'available' OR (status = 'held' AND held_until < NOW()))
           ORDER BY slot_time""",
        state["doctor_id"],
        appt_date,
    )

    alternatives = [
        {"slot_id": str(r["id"]), "slot_time": r["slot_time"][:5], "label": r["label"]}
        for r in rows
    ]

    if not alternatives:
        message = (
            "Unfortunately, no other slots are available for that day. "
            "Please choose a different date to book your appointment."
        )
    else:
        try:
            llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)
            slot_list = ", ".join(f"{s['label']} ({s['slot_time']})" for s in alternatives)
            resp = llm.invoke([
                ("system", "You are a friendly hospital receptionist. Write one short sentence telling the patient their chosen slot is taken and listing the available alternatives. Be warm and concise."),
                ("human", f"Taken slot: {state.get('slot_label')}. Available: {slot_list}"),
            ])
            message = resp.content.strip()
        except Exception as e:
            logger.warning(f"[AlternativeSuggester] LLM failed: {e}")
            slot_list = ", ".join(f"{s['label']} ({s['slot_time']})" for s in alternatives)
            message = f"That slot is no longer available. Other open slots: {slot_list}."

    return {
        "alternative_slots": alternatives,
        "reply_message": message,
        "booking_result": "slot_taken",
    }
