"""Slot Validator — deterministic rules, no LLM, no DB.

Checks:
  - appointment_date is not in the past
  - appointment_date is within 30 days
  - slot_time is one of the 4 fixed times
"""
import logging
from datetime import date, datetime, time as time_type, timedelta, timezone

from app.agent.appointment_state import AppointmentState

logger = logging.getLogger(__name__)

VALID_TIMES = {"09:00", "10:30", "14:00", "15:30"}


def slot_validator(state: AppointmentState) -> dict:
    try:
        appt_date = date.fromisoformat(state["appointment_date"])
    except (ValueError, KeyError):
        return {
            "availability_result": "invalid",
            "error_message": "Invalid appointment date format. Use YYYY-MM-DD.",
        }

    today = date.today()
    if appt_date < today:
        return {
            "availability_result": "invalid",
            "error_message": "Appointment date must be a future date.",
        }

    if appt_date > today + timedelta(days=30):
        return {
            "availability_result": "invalid",
            "error_message": "Appointments can only be booked up to 30 days in advance.",
        }

    slot_time = state.get("appointment_time", "").strip()
    if slot_time not in VALID_TIMES:
        return {
            "availability_result": "invalid",
            "error_message": f"Invalid slot time '{slot_time}'. Choose Morning 1/2 or Evening 1/2.",
        }

    if appt_date == today:
        ist_now = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).time()
        slot_time_obj = time_type.fromisoformat(slot_time)
        if slot_time_obj <= ist_now:
            return {
                "availability_result": "invalid",
                "error_message": f"The {slot_time} slot has already passed for today. Please choose a later slot.",
            }

    logger.info(f"[SlotValidator] {state['appointment_date']} {slot_time} — valid")
    return {}
