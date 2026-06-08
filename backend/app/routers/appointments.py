"""Appointment router — patient-facing + admin endpoints.

Conversation protocol (stateless — frontend accumulates answers):
  POST /appointment/conversation/{session_id}
    stage 0 answer (slot_id)  → returns Q2 (reason text)
    stage 1 answer (reason)   → returns Q3 (came_before yesno)
    stage 2 answer (yes/no)   → returns {complete: true}

  POST /appointment/book      → 202, graph runs in background
  GET  /appointment/{id}      → poll result
  GET  /appointment/by-email/{email}
  PATCH /appointment/{id}/cancel
  PATCH /appointment/{id}/reschedule
  PATCH /appointment/{id}/status   (admin)
  GET  /doctors
  GET  /appointment/slots/{doctor_id}?date=...
"""
import logging
from calendar import monthrange
from datetime import date as date_type
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from app.database.appointment_queries import (
    cancel_appointment,
    get_all_appointments,
    get_appointment_by_id,
    get_appointments_by_patient_email,
    get_available_slots,
    get_doctors,
    get_month_availability,
    reschedule_appointment,
    update_appointment_status,
)
from app.models.appointment import (
    AppointmentCreateResponse,
    AppointmentOut,
    AppointmentStatusUpdate,
    ConversationStepInput,
    ConversationStepResponse,
    DoctorOut,
    RescheduleInput,
    SubmitBookingInput,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Appointments"])

QUESTIONS = {
    1: {
        "question": "What is the reason for your visit today?",
        "input_type": "text",
    },
    2: {
        "question": "Have you visited Navajeevana Ortho Hospitals before?",
        "input_type": "yesno",
        "options": ["Yes", "No"],
    },
}


async def _run_appointment_graph(pool, graph, appointment_id: str, state: dict) -> None:
    """Background task: run appointment graph, update DB on completion."""
    try:
        config = {"configurable": {"thread_id": appointment_id}}
        async for _ in graph.astream(state, config=config, stream_mode="updates"):
            pass

        snapshot = await graph.aget_state(config)
        result: dict = dict(snapshot.values) if snapshot and snapshot.values else {}

        booking_result = result.get("booking_result", "error")
        if booking_result == "confirmed":
            logger.info(f"[AppointmentGraph] {appointment_id} confirmed")
        else:
            logger.warning(f"[AppointmentGraph] {appointment_id} result={booking_result}")
            if booking_result != "slot_taken":
                from app.database.appointment_queries import update_appointment_status as _upd
                try:
                    await _upd(pool, appointment_id, "error")
                except Exception:
                    pass

    except Exception as exc:
        logger.error(f"[AppointmentGraph] {appointment_id} failed: {exc}", exc_info=True)


# ─── Conversation ─────────────────────────────────────────────────────────────

@router.post("/appointment/conversation/{session_id}", response_model=ConversationStepResponse, tags=["Appointments"])
async def conversation_step(session_id: str, body: ConversationStepInput, request: Request):
    """Handle one Q&A step in the booking conversation widget.

    stage 0 → slot selected (answer = slot_id) → return Q2
    stage 1 → reason given  (answer = text)     → return Q3
    stage 2 → came_before   (answer = yes/no)   → return complete
    """
    pool = request.app.state.pool

    if body.stage == 0:
        slot_id = body.answer.strip()
        row = await pool.fetchrow(
            "SELECT slot_time::text, label, status FROM appointment_slots WHERE id = $1",
            slot_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Slot not found")
        if row["status"] == "booked":
            raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another.")

        return ConversationStepResponse(
            stage=1,
            **QUESTIONS[1],
            complete=False,
            session_id=session_id,
        )

    if body.stage == 1:
        if not body.answer.strip():
            raise HTTPException(status_code=422, detail="Reason for visit is required.")
        return ConversationStepResponse(
            stage=2,
            **QUESTIONS[2],
            complete=False,
            session_id=session_id,
        )

    if body.stage == 2:
        return ConversationStepResponse(
            stage=3,
            complete=True,
            input_type="done",
            session_id=session_id,
        )

    raise HTTPException(status_code=422, detail=f"Unknown stage: {body.stage}")


# ─── Doctors & Slots ──────────────────────────────────────────────────────────

@router.get("/doctors", tags=["Appointments"])
async def list_doctors(request: Request):
    """List all active doctors with their branch and schedule days."""
    pool = request.app.state.pool
    rows = await get_doctors(pool)
    return [
        DoctorOut(
            id=r["id"],
            full_name=r["full_name"],
            specialization=r.get("specialization"),
            branch=r.get("branch"),
            schedule_summary=f"{r['days']} 09:00–17:00" if r.get("days") else None,
        )
        for r in rows
    ]


@router.get("/appointment/slots/{doctor_id}/availability", tags=["Appointments"])
async def get_month_avail(doctor_id: str, month: str, request: Request):
    """Return booked-slot count per date for a doctor in a given month.

    Query param: ?month=YYYY-MM
    Response: {"2026-06-09": 2, "2026-06-14": 4, ...}
    """
    pool = request.app.state.pool
    try:
        year, mon = (int(x) for x in month.split("-"))
        month_start = date_type(year, mon, 1)
        month_end = date_type(year, mon, monthrange(year, mon)[1])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM.")

    doc = await pool.fetchrow("SELECT id FROM doctors WHERE id = $1", doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found")

    return await get_month_availability(pool, doctor_id, month_start, month_end)


@router.get("/appointment/slots/{doctor_id}", tags=["Appointments"])
async def get_slots(doctor_id: str, date: str, request: Request):
    """Return up to 4 fixed labeled slots for a doctor on a date.

    Query param: ?date=YYYY-MM-DD
    """
    pool = request.app.state.pool

    try:
        date_obj = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    doc = await pool.fetchrow("SELECT full_name FROM doctors WHERE id = $1", doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found")

    unavail = await pool.fetchrow(
        "SELECT id FROM doctor_unavailability WHERE doctor_id=$1 AND date=$2",
        doctor_id, date_obj,
    )
    if unavail:
        return {"doctor_id": doctor_id, "doctor_name": doc["full_name"], "date": date, "slots": [], "note": "Doctor is unavailable on this date."}

    holiday = await pool.fetchrow("SELECT name FROM hospital_holidays WHERE date=$1", date_obj)
    if holiday:
        return {"doctor_id": doctor_id, "doctor_name": doc["full_name"], "date": date, "slots": [], "note": f"Hospital closed — {holiday['name']}."}

    slots = await get_available_slots(pool, doctor_id, date_obj)
    return {"doctor_id": doctor_id, "doctor_name": doc["full_name"], "date": date, "slots": slots}


# ─── Booking ──────────────────────────────────────────────────────────────────

@router.post("/appointment/book", response_model=AppointmentCreateResponse, status_code=202, tags=["Appointments"])
async def book_appointment(body: SubmitBookingInput, background_tasks: BackgroundTasks, request: Request):
    """Submit booking. Graph runs in background — poll GET /appointment/{id} for result."""
    pool = request.app.state.pool
    graph = request.app.state.appointment_graph

    appointment_id = f"APPT-{uuid4().hex[:8].upper()}"

    state = {
        "appointment_id": appointment_id,
        "patient_email": body.patient_email,
        "patient_name": body.patient_name,
        "patient_phone": body.patient_phone,
        "doctor_id": body.doctor_id,
        "appointment_date": body.appointment_date,
        "appointment_time": body.appointment_time,
        "slot_label": body.slot_label,
        "slot_id": body.slot_id,
        "reason": body.reason,
        "came_before": body.came_before,
        "conversation_stage": 3,
        "conversation_complete": True,
        "availability_result": None,
        "hold_result": None,
        "booking_result": None,
        "alternative_slots": [],
        "reply_message": "",
        "error_message": None,
        "patient_history": {},
    }

    background_tasks.add_task(_run_appointment_graph, pool, graph, appointment_id, state)
    logger.info(f"[Appointments] Booking {appointment_id} queued for {body.patient_email}")

    return AppointmentCreateResponse(appointment_id=appointment_id, status="processing")


@router.get("/appointment/by-email/{email}", tags=["Appointments"])
async def get_appointments_by_email(email: str, request: Request):
    pool = request.app.state.pool
    return await get_appointments_by_patient_email(pool, email)


@router.get("/appointment/all", tags=["Appointments"])
async def get_all_appointments_route(request: Request):
    """Admin: all appointments newest first."""
    pool = request.app.state.pool
    return await get_all_appointments(pool)


@router.get("/appointment/{appointment_id}", tags=["Appointments"])
async def get_appointment(appointment_id: str, request: Request):
    """Poll appointment status. Returns current DB state."""
    pool = request.app.state.pool
    row = await get_appointment_by_id(pool, appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Appointment {appointment_id} not found")
    return row


# ─── Patient Actions ──────────────────────────────────────────────────────────

@router.patch("/appointment/{appointment_id}/cancel", tags=["Appointments"])
async def cancel_appointment_route(appointment_id: str, request: Request):
    pool = request.app.state.pool
    ok = await cancel_appointment(pool, appointment_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"appointment_id": appointment_id, "status": "cancelled"}


@router.patch("/appointment/{appointment_id}/reschedule", tags=["Appointments"])
async def reschedule_appointment_route(appointment_id: str, body: RescheduleInput, request: Request):
    pool = request.app.state.pool
    ok = await reschedule_appointment(pool, appointment_id, body.new_slot_id, body.performed_by)
    if not ok:
        raise HTTPException(status_code=404, detail="Appointment or new slot not found")
    return {"appointment_id": appointment_id, "status": "rescheduled"}


# ─── Admin Actions ────────────────────────────────────────────────────────────

@router.patch("/appointment/{appointment_id}/status", tags=["Appointments"])
async def update_status_route(appointment_id: str, body: AppointmentStatusUpdate, request: Request):
    """Admin: set status to completed or no_show."""
    if body.status not in ("completed", "no_show", "confirmed", "cancelled"):
        raise HTTPException(status_code=422, detail=f"Invalid status: {body.status}")
    pool = request.app.state.pool
    ok = await update_appointment_status(pool, appointment_id, body.status, body.performed_by)
    if not ok:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"appointment_id": appointment_id, "status": body.status}
