"""Notification Agent — sends confirmation email via Resend, then marks appointment confirmed.

No LLM. Uses httpx to call Resend REST API directly.
"""
import logging

import httpx

from app.agent.appointment_state import AppointmentState
from app.config import settings
from app.database.connection import get_pool

logger = logging.getLogger(__name__)


def _build_email_html(state: AppointmentState, doctor_name: str) -> str:
    came_note = (
        "Our team has noted that you have visited us before. "
        "Please bring your previous records and X-rays."
        if state.get("came_before")
        else "Please bring a valid ID and any relevant medical reports."
    )
    return f"""
<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
  <h2 style="color:#0d9488">Appointment Confirmed — Navajeevana Ortho Hospitals</h2>
  <p>Dear <strong>{state['patient_name']}</strong>,</p>
  <p>Your appointment has been confirmed. Details below:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;color:#555">Doctor</td>
        <td style="padding:8px"><strong>{doctor_name}</strong></td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;color:#555">Date</td>
        <td style="padding:8px"><strong>{state['appointment_date']}</strong></td></tr>
    <tr><td style="padding:8px;color:#555">Time</td>
        <td style="padding:8px"><strong>{state['slot_label']} — {state['appointment_time']}</strong></td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;color:#555">Reason</td>
        <td style="padding:8px">{state.get('reason', 'Not specified')}</td></tr>
  </table>
  <p style="color:#555">{came_note}</p>
  <p style="color:#555">Hospital: Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh</p>
  <p style="font-size:12px;color:#999">
    To cancel or reschedule, please contact us or visit your appointments page.
  </p>
</div>"""


async def notification_agent(state: AppointmentState) -> dict:
    if state.get("booking_result") != "confirmed":
        return {}

    pool = await get_pool()

    # Fetch doctor name for email
    row = await pool.fetchrow(
        "SELECT full_name FROM doctors WHERE id = $1", state["doctor_id"]
    )
    doctor_name = row["full_name"] if row else state["doctor_id"]

    resend_key = getattr(settings, "RESEND_API_KEY", "")
    from_email = getattr(settings, "RESEND_FROM_EMAIL", "")
    from_name = getattr(settings, "RESEND_FROM_NAME", "Navajeevana Ortho Hospitals")

    if resend_key and from_email:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}"},
                    json={
                        "from": f"{from_name} <{from_email}>",
                        "to": [state["patient_email"]],
                        "subject": f"Appointment Confirmed — {doctor_name} on {state['appointment_date']} at {state['appointment_time']}",
                        "html": _build_email_html(state, doctor_name),
                    },
                )
            if resp.status_code == 200:
                logger.info(f"[NotificationAgent] Email sent to {state['patient_email']}")
            else:
                logger.warning(f"[NotificationAgent] Resend returned {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"[NotificationAgent] Email failed: {e}")
    else:
        logger.warning("[NotificationAgent] RESEND_API_KEY or RESEND_FROM_EMAIL not set — skipping email")

    await pool.execute(
        """UPDATE appointments
           SET status = 'confirmed', confirmation_sent = TRUE, updated_at = NOW()
           WHERE id = $1""",
        state["appointment_id"],
    )

    return {
        "reply_message": (
            f"Your appointment with {doctor_name} on {state['appointment_date']} "
            f"({state['slot_label']} — {state['appointment_time']}) is confirmed. "
            "A confirmation email has been sent to your inbox."
        )
    }
