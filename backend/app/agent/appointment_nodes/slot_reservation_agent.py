"""Slot Reservation Agent — DB write, no LLM.

Marks the slot as booked and inserts the appointments row.
"""
import logging
from datetime import date as date_type

from app.agent.appointment_state import AppointmentState
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


async def slot_reservation_agent(state: AppointmentState) -> dict:
    pool = await get_pool()

    await pool.execute(
        "UPDATE appointment_slots SET status = 'booked' WHERE id = $1",
        state["slot_id"],
    )

    appointment_id = state["appointment_id"]
    appt_date = state["appointment_date"]
    if isinstance(appt_date, str):
        appt_date = date_type.fromisoformat(appt_date)

    await pool.execute(
        """INSERT INTO appointments
               (id, patient_name, patient_email, patient_phone,
                doctor_id, slot_id, appointment_date, appointment_time,
                slot_label, reason, came_before, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::time,$10,$11,$12,$13)
           ON CONFLICT (id) DO NOTHING""",
        appointment_id,
        state["patient_name"],
        state["patient_email"],
        state["patient_phone"],
        state["doctor_id"],
        state["slot_id"],
        appt_date,
        state["appointment_time"],
        state["slot_label"],
        state.get("reason"),
        state.get("came_before", False),
        "pending",
    )

    logger.info(f"[SlotReservationAgent] Appointment {appointment_id} created (pending)")
    return {"booking_result": "confirmed"}
