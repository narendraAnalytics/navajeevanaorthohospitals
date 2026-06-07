'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getAppointmentById, type Appointment } from '@/lib/api'

const DOCTOR_NAMES: Record<string, string> = {
  dr_arjun_reddy: 'Dr. Arjun Reddy',
  dr_meera_nair: 'Dr. Meera Nair',
  dr_kiran_kumar: 'Dr. Kiran Kumar',
  dr_priya_sharma: 'Dr. Priya Sharma',
  dr_vivek_rao: 'Dr. Vivek Rao',
  dr_lakshmi_devi: 'Dr. Lakshmi Devi',
  dr_sandeep_varma: 'Dr. Sandeep Varma',
  dr_ananya_reddy: 'Dr. Ananya Reddy',
}

type Phase = 'polling' | 'confirmed' | 'error'

export default function BookConfirmPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string ?? '')

  const [appt, setAppt] = useState<Appointment | null>(null)
  const [phase, setPhase] = useState<Phase>('polling')
  const [errMsg, setErrMsg] = useState('')
  const [dots, setDots] = useState('.')
  const attemptsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // animated dots for polling state
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 600)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!id) {
      setErrMsg('Invalid appointment ID.')
      setPhase('error')
      return
    }

    const poll = async () => {
      attemptsRef.current += 1
      try {
        const data = await getAppointmentById(id)
        if (intervalRef.current) clearInterval(intervalRef.current)
        setAppt(data)
        setPhase('confirmed')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : ''
        const is404 = msg.includes('404')
        if (!is404 || attemptsRef.current >= 12) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setErrMsg(is404
            ? 'The slot may have been taken by another patient. Please try a different slot.'
            : `Could not confirm booking: ${msg}`)
          setPhase('error')
        }
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 4000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [id])

  const doctorName = appt ? (DOCTOR_NAMES[appt.doctor_id] ?? appt.doctor_id) : ''
  const apptDate = appt?.appointment_date ? new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''

  return (
    <>
      <style>{`
        .bc-page{min-height:100vh;background:#FFFBF7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;font-family:var(--font-body,sans-serif);position:relative;overflow:hidden}
        .bc-orbs{position:fixed;inset:0;pointer-events:none;z-index:0}
        .bc-orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.32;animation:bc-float 18s ease-in-out infinite}
        .bc-orb.a{width:500px;height:500px;left:-180px;top:-140px;background:radial-gradient(circle,#9DF0D6,transparent 70%)}
        .bc-orb.b{width:440px;height:440px;right:-160px;top:300px;background:radial-gradient(circle,#FFD0BB,transparent 70%);animation-delay:-6s}
        .bc-orb.c{width:380px;height:380px;left:40%;bottom:-180px;background:radial-gradient(circle,#C7F0FF,transparent 70%);animation-delay:-12s}
        @keyframes bc-float{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-22px)}}

        .bc-card{position:relative;z-index:1;background:rgba(255,255,255,.85);backdrop-filter:blur(20px);border:1px solid rgba(17,181,164,.15);border-radius:28px;padding:48px 40px;max-width:500px;width:100%;box-shadow:0 32px 80px -16px rgba(16,42,40,.14);text-align:center}
        .bc-spinner{width:52px;height:52px;border:4px solid #E6F9F7;border-top-color:#11B5A4;border-radius:50%;animation:bc-spin .9s linear infinite;margin:0 auto 24px}
        @keyframes bc-spin{to{transform:rotate(360deg)}}
        .bc-icon{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
        .bc-icon.green{background:linear-gradient(135deg,#11B5A4,#0C8E84)}
        .bc-icon.red{background:linear-gradient(135deg,#ef4444,#dc2626)}
        .bc-title{font-family:var(--font-head,sans-serif);font-size:22px;font-weight:900;color:#102A28;margin-bottom:8px}
        .bc-sub{font-size:14px;color:#6E817D;line-height:1.65;margin-bottom:24px}
        .bc-detail-grid{background:#F0FAF8;border:1px solid rgba(17,181,164,.15);border-radius:14px;padding:18px 20px;margin:20px 0 28px;text-align:left;display:flex;flex-direction:column;gap:10px}
        .bc-detail-row{display:flex;align-items:flex-start;gap:10px;font-size:13px}
        .bc-detail-label{font-weight:700;color:#0C8E84;white-space:nowrap;min-width:80px}
        .bc-detail-val{color:#102A28;font-weight:500}
        .bc-id{font-size:11px;color:#94A3B8;margin-top:4px;font-family:monospace}
        .bc-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#FEF3C7;color:#92400E;border:1px solid #FDE68A}
        .bc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;border:none;text-decoration:none;font-family:inherit;transition:opacity .18s,transform .18s}
        .bc-btn.teal{background:linear-gradient(135deg,#11B5A4,#0C8E84);color:#fff}
        .bc-btn.outline{background:#E6F9F7;border:1.5px solid rgba(17,181,164,.3);color:#0C8E84}
        .bc-btn:hover{opacity:.9;transform:scale(1.02)}
        .bc-btns{display:flex;flex-direction:column;gap:10px}
        .bc-brand{font-family:var(--font-head,sans-serif);font-size:13px;font-weight:700;color:#11B5A4;margin-bottom:24px}
      `}</style>

      <div className="bc-page">
        <div className="bc-orbs" aria-hidden="true">
          <div className="bc-orb a" /><div className="bc-orb b" /><div className="bc-orb c" />
        </div>

        <div className="bc-card">
          <div className="bc-brand">Navajeevana Ortho Hospitals</div>

          {phase === 'polling' && (
            <>
              <div className="bc-spinner" />
              <div className="bc-title">Confirming your appointment{dots}</div>
              <div className="bc-sub">
                Our system is processing your booking. This usually takes a few seconds.<br />
                <span style={{ fontSize: 11, color: '#94A3B8', display: 'block', marginTop: 8 }}>
                  Appointment ID: {id}
                </span>
              </div>
            </>
          )}

          {phase === 'confirmed' && appt && (
            <>
              <div className="bc-icon green">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" width={32} height={32}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
              <div className="bc-title">Booking Received!</div>
              <div className="bc-sub">
                Your appointment request has been successfully submitted.
                We will confirm it shortly.
              </div>

              <div className="bc-detail-grid">
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Doctor</span>
                  <span className="bc-detail-val">{doctorName}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Date</span>
                  <span className="bc-detail-val">{apptDate}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Time</span>
                  <span className="bc-detail-val">{appt.slot_label} ({appt.appointment_time})</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Patient</span>
                  <span className="bc-detail-val">{appt.patient_name}</span>
                </div>
                <div className="bc-detail-row">
                  <span className="bc-detail-label">Status</span>
                  <span className="bc-badge">Pending Confirmation</span>
                </div>
                <div className="bc-id">ID: {appt.id}</div>
              </div>

              <div className="bc-btns">
                <Link href="/patient/appointments" className="bc-btn teal">View My Appointments</Link>
                <Link href="/doctors" className="bc-btn outline">Book Another Appointment</Link>
              </div>
            </>
          )}

          {phase === 'error' && (
            <>
              <div className="bc-icon red">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" width={30} height={30}>
                  <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
                </svg>
              </div>
              <div className="bc-title">Booking Unsuccessful</div>
              <div className="bc-sub">{errMsg || 'Something went wrong with your booking. Please try again.'}</div>

              <div className="bc-btns">
                <Link href="/doctors" className="bc-btn teal">Try Again</Link>
                <Link href="/patient/appointments" className="bc-btn outline">Check My Appointments</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
