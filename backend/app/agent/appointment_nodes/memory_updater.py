"""Memory Updater — writes appointment data to AsyncPostgresStore (long-term patient memory).

Shared store with the ticketing graph — ticketing orchestrator will see appointment history.
"""
import logging

from langgraph.store.base import BaseStore

from app.agent.appointment_state import AppointmentState

logger = logging.getLogger(__name__)


async def memory_updater(state: AppointmentState, store: BaseStore) -> dict:
    if state.get("booking_result") != "confirmed":
        return {}

    patient_email = state["patient_email"]
    namespace = ("patient", patient_email.replace(".", "_").replace("@", "_AT_"))

    existing = {}
    try:
        result = await store.aget(namespace, "appointment_history")
        if result:
            existing = result.value or {}
    except Exception:
        pass

    visit_count = existing.get("visit_count", 0) + 1
    reasons = existing.get("appointment_reasons", [])
    if state.get("reason") and state["reason"] not in reasons:
        reasons.append(state["reason"])

    updated = {
        "last_appointment": f"{state['appointment_date']} {state['appointment_time']}",
        "slot_label": state.get("slot_label"),
        "preferred_doctor": state["doctor_id"],
        "came_before": state.get("came_before", False),
        "visit_count": visit_count,
        "appointment_reasons": reasons[-10:],  # keep last 10
    }

    try:
        await store.aput(namespace, "appointment_history", updated)
        logger.info(f"[MemoryUpdater] Updated appointment history for {patient_email} (visit #{visit_count})")
    except Exception as e:
        logger.error(f"[MemoryUpdater] Failed to write store: {e}")

    return {}
