"""Slot Hold Agent — DB update, no LLM.

Holds the slot for 5 minutes to prevent race conditions during booking confirmation.
Only holds if status is 'available' (or held with expired TTL).
"""
import logging

from app.agent.appointment_state import AppointmentState
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


async def slot_hold_agent(state: AppointmentState) -> dict:
    slot_id = state.get("slot_id")
    pool = await get_pool()

    result = await pool.execute(
        """UPDATE appointment_slots
           SET status = 'held',
               held_until = NOW() + INTERVAL '5 minutes'
           WHERE id = $1
             AND (status = 'available'
                  OR (status = 'held' AND held_until < NOW()))""",
        slot_id,
    )

    # asyncpg returns "UPDATE N" — check if 1 row was updated
    updated = int(result.split()[-1]) if result else 0

    if updated == 1:
        logger.info(f"[SlotHoldAgent] Held slot {slot_id} for 5 min")
        return {"hold_result": "held"}

    logger.warning(f"[SlotHoldAgent] Could not hold slot {slot_id} — already taken")
    return {"hold_result": "failed"}
