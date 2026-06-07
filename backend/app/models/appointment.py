from typing import Optional
from pydantic import BaseModel


class ConversationStepInput(BaseModel):
    stage: int
    answer: str


class ConversationStepResponse(BaseModel):
    stage: int
    question: Optional[str] = None
    input_type: str                    # "select" | "text" | "yesno"
    options: Optional[list[str]] = None
    complete: bool = False
    session_id: str


class SubmitBookingInput(BaseModel):
    patient_name: str
    patient_email: str
    patient_phone: str
    doctor_id: str
    appointment_date: str              # YYYY-MM-DD
    appointment_time: str              # HH:MM
    slot_label: str
    slot_id: str
    reason: str
    came_before: bool
    session_id: str


class AppointmentCreateResponse(BaseModel):
    appointment_id: str
    status: str = "processing"


class DoctorOut(BaseModel):
    id: str
    full_name: str
    specialization: Optional[str] = None
    branch: Optional[str] = None
    schedule_summary: Optional[str] = None


class AppointmentSlotOut(BaseModel):
    slot_id: str
    slot_time: str
    label: str
    status: str


class AppointmentSlotsResponse(BaseModel):
    doctor_id: str
    doctor_name: str
    date: str
    slots: list[AppointmentSlotOut]


class AppointmentOut(BaseModel):
    id: str
    patient_name: str
    patient_email: str
    patient_phone: str
    doctor_id: str
    doctor_name: Optional[str] = None
    appointment_date: str
    appointment_time: str
    slot_label: Optional[str] = None
    status: str
    reason: Optional[str] = None
    came_before: bool = False
    created_at: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str                        # completed | no_show
    performed_by: Optional[str] = None


class RescheduleInput(BaseModel):
    new_slot_id: str
    performed_by: Optional[str] = None
