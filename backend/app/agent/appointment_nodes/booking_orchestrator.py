"""Booking Orchestrator — pure Python, no LLM.

Validates all required fields are present after the conversation widget.
Loads patient history from AsyncPostgresStore if came_before=True.
"""
import logging

from langgraph.store.base import BaseStore

from app.agent.appointment_state import AppointmentState

logger = logging.getLogger(__name__)

REQUIRED = ["patient_email", "patient_name", "patient_phone",
            "doctor_id", "appointment_date", "appointment_time",
            "slot_label", "slot_id", "reason"]


async def booking_orchestrator(state: AppointmentState, store: BaseStore) -> dict:
    for field in REQUIRED:
        if not state.get(field):
            logger.warning(f"[BookingOrchestrator] Missing required field: {field}")
            return {
                "availability_result": "invalid",
                "error_message": f"Missing required field: {field}",
            }

    patient_history = {}
    if state.get("came_before"):
        try:
            namespace = ("patient", state["patient_email"])
            result = await store.aget(namespace, "appointment_history")
            if result:
                patient_history = result.value or {}
                logger.info(f"[BookingOrchestrator] Loaded history for {state['patient_email']}")
        except Exception as e:
            logger.warning(f"[BookingOrchestrator] Could not load patient history: {e}")

    return {"patient_history": patient_history}
