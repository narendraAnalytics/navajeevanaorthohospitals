"""Availability Checker — DB query, no LLM.

Checks the specific slot (slot_id) is still available.
Held slots whose TTL has expired are treated as available.
"""
import logging

from app.agent.appointment_state import AppointmentState
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


async def availability_checker(state: AppointmentState) -> dict:
    if state.get("availability_result") == "invalid":
        return {}

    slot_id = state.get("slot_id")
    if not slot_id:
        return {"availability_result": "invalid", "error_message": "No slot selected."}

    pool = await get_pool()
    row = await pool.fetchrow(
        """SELECT status, held_until
           FROM appointment_slots
           WHERE id = $1""",
        slot_id,
    )

    if not row:
        return {"availability_result": "invalid", "error_message": "Slot not found."}

    from datetime import datetime, timezone
    status = row["status"]
    held_until = row["held_until"]

    if status == "booked":
        logger.info(f"[AvailabilityChecker] Slot {slot_id} is booked")
        return {"availability_result": "taken"}

    if status == "held":
        now = datetime.now(timezone.utc)
        if held_until and held_until > now:
            logger.info(f"[AvailabilityChecker] Slot {slot_id} is held (not expired)")
            return {"availability_result": "taken"}

    logger.info(f"[AvailabilityChecker] Slot {slot_id} is available")
    return {"availability_result": "available"}
