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
        "Please bring your previous records and X-rays if available."
        if state.get("came_before")
        else "Please bring a valid ID and any relevant medical reports."
    )
    came_icon = "&#128203;" if state.get("came_before") else "&#9432;"
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Appointment Confirmed</title></head>
<body style="margin:0;padding:0;background:#FFFBF7;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER BANNER -->
  <tr>
    <td style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1.5px solid rgba(255,255,255,0.35);border-radius:50px;padding:6px 18px;margin-bottom:16px;">
        <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">&#10003;&nbsp; APPOINTMENT CONFIRMED</span>
      </div>
      <div style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;margin-bottom:4px;">
        Navajeevana Ortho Hospitals
      </div>
      <div style="color:#99f6e4;font-size:13px;">Bhimavaram, Andhra Pradesh</div>
    </td>
  </tr>

  <!-- BODY CARD -->
  <tr>
    <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:36px 40px 32px;box-shadow:0 4px 24px rgba(13,148,136,0.08);">

      <!-- Greeting -->
      <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#134e4a;">
        Dear {state['patient_name']},
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.5;">
        Your appointment has been successfully booked. Here are your details:
      </p>

      <!-- Details table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1.5px solid #ccfbf1;">

        <tr style="background:#f0fdfa;">
          <td style="padding:14px 20px;width:40%;">
            <span style="font-size:16px;">&#128101;</span>&nbsp;
            <span style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Doctor</span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:15px;font-weight:700;color:#134e4a;">{doctor_name}</span>
          </td>
        </tr>

        <tr style="background:#ffffff;">
          <td style="padding:14px 20px;">
            <span style="font-size:16px;">&#128197;</span>&nbsp;
            <span style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Date</span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:15px;font-weight:700;color:#134e4a;">{state['appointment_date']}</span>
          </td>
        </tr>

        <tr style="background:#f0fdfa;">
          <td style="padding:14px 20px;">
            <span style="font-size:16px;">&#9200;</span>&nbsp;
            <span style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Time</span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:15px;font-weight:700;color:#134e4a;">{state['slot_label']}</span>
            <span style="font-size:13px;color:#0d9488;margin-left:6px;">&#8212; {state['appointment_time']}</span>
          </td>
        </tr>

        <tr style="background:#ffffff;">
          <td style="padding:14px 20px;">
            <span style="font-size:16px;">&#128203;</span>&nbsp;
            <span style="font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;">Reason</span>
          </td>
          <td style="padding:14px 20px;">
            <span style="font-size:15px;color:#374151;">{state.get('reason', 'Not specified')}</span>
          </td>
        </tr>

      </table>

      <!-- Info note -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
        <tr>
          <td style="background:#f0fdfa;border-left:4px solid #0d9488;border-radius:0 10px 10px 0;padding:14px 18px;">
            <span style="font-size:16px;">{came_icon}</span>&nbsp;
            <span style="font-size:14px;color:#134e4a;line-height:1.6;">{came_note}</span>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <hr style="border:none;border-top:1.5px solid #f0fdfa;margin:28px 0;">

      <!-- Cancel/reschedule note -->
      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
        Need to cancel or reschedule? Visit your appointments page or contact us directly.<br>
        We look forward to seeing you at Navajeevana Ortho Hospitals.
      </p>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#134e4a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;margin-top:4px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#99f6e4;">Navajeevana Ortho Hospitals</p>
      <p style="margin:0;font-size:12px;color:#5eead4;">Bhimavaram, Andhra Pradesh, India</p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>"""


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
