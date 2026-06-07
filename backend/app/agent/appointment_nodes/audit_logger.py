"""Audit Logger — DB insert, no LLM.

Records every booking event in appointment_audit_logs.
"""
import json
import logging

from app.agent.appointment_state import AppointmentState
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


async def audit_logger(state: AppointmentState) -> dict:
    pool = await get_pool()

    action = "created" if state.get("booking_result") == "confirmed" else state.get("booking_result", "unknown")

    metadata = {
        "slot_id": state.get("slot_id"),
        "slot_label": state.get("slot_label"),
        "appointment_time": state.get("appointment_time"),
        "doctor_id": state.get("doctor_id"),
        "came_before": state.get("came_before"),
    }

    await pool.execute(
        """INSERT INTO appointment_audit_logs
               (appointment_id, action, performed_by, metadata)
           VALUES ($1, $2, $3, $4)""",
        state["appointment_id"],
        action,
        state.get("patient_email"),
        json.dumps(metadata),
    )

    logger.info(f"[AuditLogger] Logged action='{action}' for {state['appointment_id']}")
    return {}
