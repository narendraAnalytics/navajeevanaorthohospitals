"""Error Packager — llm_flash.

Formats a friendly patient-facing error message when the booking request is invalid.
"""
import logging

from langchain_groq import ChatGroq

from app.agent.appointment_state import AppointmentState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)


def error_packager(state: AppointmentState) -> dict:
    raw_error = state.get("error_message") or "Your booking request could not be processed."

    try:
        llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)
        resp = llm.invoke([
            ("system", (
                "You are a friendly hospital receptionist at Navajeevana Ortho Hospitals. "
                "Rewrite the following technical error into one warm, polite sentence for the patient. "
                "Do not include any medical advice. Keep it under 30 words."
            )),
            ("human", raw_error),
        ])
        message = resp.content.strip()
    except Exception as e:
        logger.warning(f"[ErrorPackager] LLM failed: {e}")
        message = f"We could not process your booking. {raw_error}"

    return {"reply_message": message, "booking_result": "error"}
