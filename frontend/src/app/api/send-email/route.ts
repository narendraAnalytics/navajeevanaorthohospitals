import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `${process.env.RESEND_FROM_NAME ?? 'Navajeevana Ortho Hospitals'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'}>`
const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const urgencyBorder: Record<string, string> = {
  high:     '#EF4444',
  critical: '#EF4444',
  medium:   '#F59E0B',
  low:      '#10B981',
}

function formatReplyHtml(text: string, name: string, urgency: string): string {
  const borderColor = urgencyBorder[urgency?.toLowerCase()] ?? '#0D9488'
  const body = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0D9488,#059669);padding:28px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="color:#fff;">
                <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;">Navajeevana Ortho Hospitals</div>
                <div style="font-size:13px;opacity:.8;margin-top:4px;">Bhimavaram, Andhra Pradesh</div>
              </td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;border-left:4px solid ${borderColor};">
            <p style="font-size:15px;color:#1E293B;margin:0 0 16px;">Dear <strong>${name}</strong>,</p>
            <div style="font-size:14.5px;color:#334155;line-height:1.75;">
              <p>${body}</p>
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 32px;"><div style="border-top:1px solid #E2E8F0;"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background:#F8FAFC;">
            <div style="font-size:12px;color:#64748B;line-height:1.8;">
              <strong style="color:#475569;">Navajeevana Ortho Hospitals</strong><br>
              Bhimavaram, West Godavari District, Andhra Pradesh<br>
              Phone: +91 9494559848<br><br>
              <span style="font-size:11px;color:#94A3B8;">This is an automated response from our AI-assisted patient support system. Please do not reply directly to this email. For urgent matters, call us directly.</span>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { ticket_id } = await req.json() as { ticket_id: string }
    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })
    }

    // Fetch ticket detail from backend
    const ticketRes = await fetch(`${BACKEND}/review/${ticket_id}`)
    if (!ticketRes.ok) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    const ticket = await ticketRes.json() as {
      customer_name: string
      customer_email: string
      urgency: string
      ai_draft: string | null
      edited_reply: string | null
      final_sent_reply: string | null
    }

    const reply = ticket.final_sent_reply ?? ticket.edited_reply ?? ticket.ai_draft
    if (!reply) {
      return NextResponse.json({ error: 'No reply available to send' }, { status: 422 })
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: ticket.customer_email,
      subject: 'Response to Your Query — Navajeevana Ortho Hospitals',
      html: formatReplyHtml(reply, ticket.customer_name, ticket.urgency),
    })

    if (error) {
      console.error('[send-email] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark ticket as emailed in backend
    await fetch(`${BACKEND}/review/${ticket_id}/send-email`, { method: 'POST' })

    return NextResponse.json({ success: true, message_id: data?.id, message: 'Email sent successfully' })
  } catch (err) {
    console.error('[send-email] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
