'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { getAppointmentsByEmail, cancelAppointment, type Appointment } from '@/lib/api'

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  confirmed:  { bg: '#D1FAE5', color: '#065F46', label: 'Confirmed' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
  completed:  { bg: '#E0E7FF', color: '#3730A3', label: 'Completed' },
  no_show:    { bg: '#F3F4F6', color: '#374151', label: 'No Show' },
  rescheduled:{ bg: '#EDE9FE', color: '#5B21B6', label: 'Rescheduled' },
}

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

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function MyAppointmentsPage() {
  const { user, isLoaded } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [flash, setFlash] = useState('')

  const load = useCallback(async () => {
    if (!email) return
    setLoading(true); setError('')
    try {
      const data = await getAppointmentsByEmail(email)
      setAppointments(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => { if (isLoaded && email) load() }, [isLoaded, email, load])

  const handleCancel = async (a: Appointment) => {
    if (!window.confirm(`Cancel your appointment with ${DOCTOR_NAMES[a.doctor_id] ?? a.doctor_id} on ${fmtDate(a.appointment_date)}?`)) return
    setCancelling(a.id)
    try {
      await cancelAppointment(a.id)
      setFlash('Appointment cancelled.')
      setTimeout(() => setFlash(''), 3000)
      load()
    } catch (e: unknown) {
      setFlash(e instanceof Error ? e.message : 'Cancel failed.')
      setTimeout(() => setFlash(''), 4000)
    } finally {
      setCancelling(null)
    }
  }

  const canCancel = (status: string) => status !== 'cancelled' && status !== 'completed' && status !== 'no_show'

  return (
    <>
      <style>{`
        .ap-page{min-height:100vh;background:#FFFBF7;font-family:var(--font-body,sans-serif);position:relative;overflow-x:hidden;padding-bottom:60px}
        .ap-orbs{position:fixed;inset:0;pointer-events:none;z-index:0}
        .ap-orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.3;animation:ap-float 18s ease-in-out infinite}
        .ap-orb.a{width:500px;height:500px;left:-180px;top:-140px;background:radial-gradient(circle,#9DF0D6,transparent 70%)}
        .ap-orb.b{width:440px;height:440px;right:-160px;top:300px;background:radial-gradient(circle,#FFD0BB,transparent 70%);animation-delay:-6s}
        .ap-orb.c{width:380px;height:380px;left:40%;bottom:-180px;background:radial-gradient(circle,#C7F0FF,transparent 70%);animation-delay:-12s}
        @keyframes ap-float{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-22px)}}

        .ap-header{position:sticky;top:0;z-index:50;background:rgba(255,251,247,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(17,181,164,.12);padding:0 24px}
        .ap-header-inner{max-width:800px;margin:0 auto;height:60px;display:flex;align-items:center;gap:14px}
        .ap-back{display:flex;align-items:center;gap:7px;padding:7px 16px;border-radius:50px;background:#E6F9F7;border:1.5px solid rgba(17,181,164,.3);color:#0C8E84;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap;font-family:var(--font-body,sans-serif)}
        .ap-back:hover{background:#11B5A4;color:#fff}
        .ap-header-title{font-family:var(--font-head,sans-serif);font-size:15px;font-weight:800;color:#102A28}
        .ap-book-btn{margin-left:auto;display:flex;align-items:center;gap:7px;padding:8px 18px;border-radius:50px;background:linear-gradient(135deg,#11B5A4,#0C8E84);color:#fff;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;border:none;transition:opacity .18s;font-family:inherit;white-space:nowrap}
        .ap-book-btn:hover{opacity:.9}

        .ap-content{position:relative;z-index:1;max-width:800px;margin:0 auto;padding:32px 24px}
        .ap-hero{margin-bottom:28px}
        .ap-hero h1{font-family:var(--font-head,sans-serif);font-size:clamp(22px,3vw,32px);font-weight:900;color:#102A28;margin-bottom:6px}
        .ap-hero p{font-size:14px;color:#6E817D}

        .ap-flash{position:fixed;top:20px;right:20px;z-index:999;background:#102A28;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:ap-fadein .25s ease}
        @keyframes ap-fadein{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

        .ap-card{background:rgba(255,255,255,.85);backdrop-filter:blur(14px);border:1px solid rgba(17,181,164,.12);border-radius:20px;padding:22px 24px;margin-bottom:16px;transition:box-shadow .2s}
        .ap-card:hover{box-shadow:0 12px 40px -8px rgba(16,42,40,.14)}
        .ap-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
        .ap-doctor{font-family:var(--font-head,sans-serif);font-size:16px;font-weight:800;color:#102A28}
        .ap-badges{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
        .ap-status{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
        .ap-new-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:#EDE9FE;color:#5B21B6}
        .ap-card-body{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin-bottom:16px}
        @media(max-width:520px){.ap-card-body{grid-template-columns:1fr}}
        .ap-field{display:flex;flex-direction:column;gap:2px}
        .ap-field-label{font-size:10px;font-weight:700;color:#11B5A4;text-transform:uppercase;letter-spacing:.05em}
        .ap-field-val{font-size:13px;color:#102A28;font-weight:600}
        .ap-reason{grid-column:1/-1}
        .ap-id{font-size:10.5px;color:#94A3B8;margin-top:4px;font-family:monospace}
        .ap-card-footer{display:flex;justify-content:flex-end;border-top:1px solid rgba(17,181,164,.1);padding-top:14px}
        .ap-cancel-btn{padding:8px 20px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid #FCA5A5;background:#FFF5F5;color:#DC2626;font-family:inherit;transition:all .18s}
        .ap-cancel-btn:hover:not(:disabled){background:#DC2626;color:#fff;border-color:#DC2626}
        .ap-cancel-btn:disabled{opacity:.45;cursor:not-allowed}

        .ap-empty{text-align:center;padding:60px 20px;color:#6E817D}
        .ap-empty svg{opacity:.3;margin:0 auto 14px;display:block}
        .ap-empty p{font-size:15px;font-weight:600;margin-bottom:16px}
        .ap-spinner{width:36px;height:36px;border:3px solid #E6F9F7;border-top-color:#11B5A4;border-radius:50%;animation:ap-spin .8s linear infinite;margin:60px auto}
        @keyframes ap-spin{to{transform:rotate(360deg)}}
        .ap-err{background:#FFF5F5;border:1px solid #FCA5A5;border-radius:14px;padding:16px 20px;color:#DC2626;font-size:13px;font-weight:600;margin-bottom:20px}
      `}</style>

      <div className="ap-page">
        <div className="ap-orbs" aria-hidden="true">
          <div className="ap-orb a" /><div className="ap-orb b" /><div className="ap-orb c" />
        </div>

        {flash && <div className="ap-flash">{flash}</div>}

        <header className="ap-header">
          <div className="ap-header-inner">
            <Link href="/patient" className="ap-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={13} height={13}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Care Hub
            </Link>
            <div className="ap-header-title">My Appointments</div>
            <Link href="/doctors" className="ap-book-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}>
                <rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} />
              </svg>
              Book New
            </Link>
          </div>
        </header>

        <div className="ap-content">
          <div className="ap-hero">
            <h1>My Appointments</h1>
            <p>All your orthopedic appointments in one place.</p>
          </div>

          {error && <div className="ap-err">{error}</div>}

          {loading && <div className="ap-spinner" />}

          {!loading && !error && appointments.length === 0 && (
            <div className="ap-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={52} height={52}>
                <rect x={3} y={4} width={18} height={18} rx={2} />
                <line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} />
              </svg>
              <p>No appointments yet.</p>
              <Link href="/doctors" className="ap-book-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                Book Your First Appointment
              </Link>
            </div>
          )}

          {!loading && appointments.map(a => {
            const st = STATUS_COLOR[a.status] ?? { bg: '#F3F4F6', color: '#374151', label: a.status }
            const docName = DOCTOR_NAMES[a.doctor_id] ?? a.doctor_id
            return (
              <div key={a.id} className="ap-card">
                <div className="ap-card-top">
                  <div className="ap-doctor">{docName}</div>
                  <div className="ap-badges">
                    <span className="ap-status" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <span className="ap-new-tag">{a.came_before ? 'Returning' : 'New Patient'}</span>
                  </div>
                </div>

                <div className="ap-card-body">
                  <div className="ap-field">
                    <span className="ap-field-label">Date</span>
                    <span className="ap-field-val">{fmtDate(a.appointment_date)}</span>
                  </div>
                  <div className="ap-field">
                    <span className="ap-field-label">Time</span>
                    <span className="ap-field-val">{a.slot_label} ({a.appointment_time})</span>
                  </div>
                  <div className="ap-field ap-reason">
                    <span className="ap-field-label">Reason</span>
                    <span className="ap-field-val">{a.reason || '—'}</span>
                  </div>
                  <div className="ap-field" style={{ gridColumn: '1/-1' }}>
                    <span className="ap-id">ID: {a.id}</span>
                  </div>
                </div>

                {canCancel(a.status) && (
                  <div className="ap-card-footer">
                    <button
                      className="ap-cancel-btn"
                      onClick={() => handleCancel(a)}
                      disabled={cancelling === a.id}
                    >
                      {cancelling === a.id ? 'Cancelling…' : 'Cancel Appointment'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
