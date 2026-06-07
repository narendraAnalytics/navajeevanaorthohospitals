"""Appointment-specific DB queries — all new tables, zero overlap with queries.py."""
import json
import logging
from datetime import date as date_type, time as time_type
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)


async def get_doctors(pool: asyncpg.Pool) -> list[dict]:
    rows = await pool.fetch(
        """SELECT d.id, d.full_name, d.specialization, d.branch,
                  string_agg(DISTINCT ds.day_of_week, '/' ORDER BY ds.day_of_week) AS days
           FROM doctors d
           LEFT JOIN doctor_schedules ds ON ds.doctor_id = d.id
           WHERE d.is_active = TRUE
           GROUP BY d.id, d.full_name, d.specialization, d.branch
           ORDER BY d.full_name"""
    )
    return [dict(r) for r in rows]


async def get_available_slots(pool: asyncpg.Pool, doctor_id: str, slot_date: date_type) -> list[dict]:
    rows = await pool.fetch(
        """SELECT id, slot_time::text, label, status
           FROM appointment_slots
           WHERE doctor_id = $1
             AND slot_date = $2
           ORDER BY slot_time""",
        doctor_id, slot_date,
    )
    return [
        {
            "slot_id": str(r["id"]),
            "slot_time": r["slot_time"][:5],
            "label": r["label"],
            "status": r["status"] if r["status"] != "held" else "available",
        }
        for r in rows
    ]


async def get_appointment_by_id(pool: asyncpg.Pool, appt_id: str) -> Optional[dict]:
    row = await pool.fetchrow(
        """SELECT a.*, d.full_name AS doctor_name
           FROM appointments a
           LEFT JOIN doctors d ON d.id = a.doctor_id
           WHERE a.id = $1""",
        appt_id,
    )
    if not row:
        return None
    data = dict(row)
    data["appointment_date"] = str(data["appointment_date"])
    data["appointment_time"] = str(data["appointment_time"])[:5]
    if data.get("created_at"):
        data["created_at"] = data["created_at"].isoformat()
    if data.get("updated_at"):
        data["updated_at"] = data["updated_at"].isoformat()
    return data


async def get_appointments_by_patient_email(pool: asyncpg.Pool, email: str) -> list[dict]:
    rows = await pool.fetch(
        """SELECT a.*, d.full_name AS doctor_name
           FROM appointments a
           LEFT JOIN doctors d ON d.id = a.doctor_id
           WHERE a.patient_email = $1
           ORDER BY a.created_at DESC""",
        email,
    )
    result = []
    for r in rows:
        data = dict(r)
        data["appointment_date"] = str(data["appointment_date"])
        data["appointment_time"] = str(data["appointment_time"])[:5]
        if data.get("created_at"):
            data["created_at"] = data["created_at"].isoformat()
        if data.get("updated_at"):
            data["updated_at"] = data["updated_at"].isoformat()
        result.append(data)
    return result


async def get_all_appointments(pool: asyncpg.Pool) -> list[dict]:
    rows = await pool.fetch(
        """SELECT a.*, d.full_name AS doctor_name
           FROM appointments a
           LEFT JOIN doctors d ON d.id = a.doctor_id
           ORDER BY a.created_at DESC"""
    )
    result = []
    for r in rows:
        data = dict(r)
        data["appointment_date"] = str(data["appointment_date"])
        data["appointment_time"] = str(data["appointment_time"])[:5]
        if data.get("created_at"):
            data["created_at"] = data["created_at"].isoformat()
        if data.get("updated_at"):
            data["updated_at"] = data["updated_at"].isoformat()
        result.append(data)
    return result


async def cancel_appointment(pool: asyncpg.Pool, appt_id: str) -> bool:
    row = await pool.fetchrow("SELECT slot_id FROM appointments WHERE id = $1", appt_id)
    if not row:
        return False
    if row["slot_id"]:
        await pool.execute(
            "UPDATE appointment_slots SET status = 'available' WHERE id = $1",
            row["slot_id"],
        )
    await pool.execute(
        "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        appt_id,
    )
    await log_appointment_audit(pool, appt_id, "cancelled", None, {})
    return True


async def reschedule_appointment(pool: asyncpg.Pool, appt_id: str, new_slot_id: str, performed_by: Optional[str] = None) -> bool:
    row = await pool.fetchrow(
        "SELECT slot_id, appointment_time, slot_label FROM appointments WHERE id = $1", appt_id
    )
    if not row:
        return False

    old_slot_id = row["slot_id"]
    old_time = str(row["appointment_time"])[:5]
    old_label = row["slot_label"]

    if old_slot_id:
        await pool.execute(
            "UPDATE appointment_slots SET status = 'available' WHERE id = $1", old_slot_id
        )

    new_slot = await pool.fetchrow(
        "SELECT slot_time::text, label FROM appointment_slots WHERE id = $1", new_slot_id
    )
    if not new_slot:
        return False

    await pool.execute(
        "UPDATE appointment_slots SET status = 'booked' WHERE id = $1", new_slot_id
    )
    new_time = time_type.fromisoformat(new_slot["slot_time"][:5])
    await pool.execute(
        """UPDATE appointments
           SET slot_id = $1, appointment_time = $2, slot_label = $3,
               status = 'rescheduled', updated_at = NOW()
           WHERE id = $4""",
        new_slot_id, new_time, new_slot["label"], appt_id,
    )
    await log_appointment_audit(pool, appt_id, "rescheduled", performed_by, {
        "old_slot": old_label, "old_time": old_time,
        "new_slot": new_slot["label"], "new_time": new_slot["slot_time"][:5],
    })
    return True


async def update_appointment_status(pool: asyncpg.Pool, appt_id: str, status: str, performed_by: Optional[str] = None) -> bool:
    result = await pool.execute(
        "UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2",
        status, appt_id,
    )
    updated = int(result.split()[-1]) if result else 0
    if updated:
        await log_appointment_audit(pool, appt_id, status, performed_by, {})
    return updated > 0


async def log_appointment_audit(pool: asyncpg.Pool, appt_id: str, action: str, performed_by: Optional[str], metadata: dict) -> None:
    await pool.execute(
        """INSERT INTO appointment_audit_logs (appointment_id, action, performed_by, metadata)
           VALUES ($1, $2, $3, $4)""",
        appt_id, action, performed_by, json.dumps(metadata),
    )
