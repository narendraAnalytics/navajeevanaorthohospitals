from typing import Optional
from typing_extensions import TypedDict


class AppointmentState(TypedDict):
    # Patient info (from form)
    appointment_id: str
    patient_email: str
    patient_name: str
    patient_phone: str
    doctor_id: str
    appointment_date: str          # YYYY-MM-DD

    # Collected by conversation widget (Q1 / Q2 / Q3)
    appointment_time: str          # HH:MM  e.g. "09:00"
    slot_label: str                # "Morning 1" | "Morning 2" | "Evening 1" | "Evening 2"
    slot_id: Optional[str]
    reason: Optional[str]
    came_before: Optional[bool]

    # Conversation tracking
    conversation_stage: int        # 0=slot, 1=reason, 2=came_before, 3=done
    conversation_complete: bool

    # Graph routing results
    availability_result: Optional[str]   # "available" | "taken" | "invalid"
    hold_result: Optional[str]           # "held" | "failed"
    booking_result: Optional[str]        # "confirmed" | "error"

    # Output
    alternative_slots: list
    reply_message: str
    error_message: Optional[str]
    patient_history: dict
