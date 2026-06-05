'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { submitTicket, getTicket, getTicketsByEmail, type Ticket } from '@/lib/api'

type Tab = 'submit' | 'track'

const statusLabel: Record<string, { label: string; color: string; dot: string }> = {
  processing:          { label: 'Processing',  color: 'rgba(245,158,11,.12)',  dot: '#F59E0B' },
  pending_review:      { label: 'Under Review', color: 'rgba(59,130,246,.12)',  dot: '#3B82F6' },
  approved:            { label: 'Approved',     color: 'rgba(16,185,129,.12)',  dot: '#10B981' },
  emailed:             { label: 'Reply Sent',   color: 'rgba(16,185,129,.12)',  dot: '#10B981' },
  escalated:           { label: 'Escalated',    color: 'rgba(239,68,68,.12)',   dot: '#EF4444' },
  escalated_to_senior: { label: 'Escalated',    color: 'rgba(239,68,68,.12)',   dot: '#EF4444' },
  resolved:            { label: 'Resolved',     color: 'rgba(107,114,128,.12)', dot: '#9CA3AF' },
}

const statusTextColor: Record<string, string> = {
  processing: '#92400E', pending_review: '#1D4ED8',
  approved: '#065F46', emailed: '#065F46',
  escalated: '#991B1B', escalated_to_senior: '#991B1B', resolved: '#374151',
}

export default function PatientPortal() {
  const { user } = useUser()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('submit')

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [trackId, setTrackId] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [tracking, setTracking] = useState(false)
  const [trackError, setTrackError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [trackMode, setTrackMode] = useState<'id' | 'email'>('id')
  const [emailTickets, setEmailTickets] = useState<Ticket[] | null>(null)
  const [emailTracking, setEmailTracking] = useState(false)
  const [emailTrackError, setEmailTrackError] = useState('')

  // Pre-fill from Clerk profile once loaded
  useEffect(() => {
    if (!user) return
    setForm(f => ({
      ...f,
      name: f.name || user.fullName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      email: user.emailAddresses[0]?.emailAddress ?? '',
    }))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await submitTicket({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || undefined,
        message: form.message,
      })
      router.push(`/patient/processing/${res.ticket_id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailTrack = async () => {
    const email = form.email
    if (!email) return
    setEmailTracking(true)
    setEmailTrackError('')
    setEmailTickets(null)
    try {
      const tickets = await getTicketsByEmail(email)
      setEmailTickets(tickets)
    } catch {
      setEmailTrackError('Could not load your queries. Please try again.')
    } finally {
      setEmailTracking(false)
    }
  }

  const handleTrack = async () => {
    if (!trackId.trim()) return
    setTracking(true)
    setTrackError('')
    setTicket(null)
    try {
      const t = await getTicket(trackId.trim())
      setTicket(t)
    } catch {
      setTrackError('Ticket not found. Please check your ticket ID.')
    } finally {
      setTracking(false)
    }
  }

  useEffect(() => {
    if (ticket?.status === 'processing') {
      pollRef.current = setInterval(async () => {
        try {
          const t = await getTicket(ticket.ticket_id)
          setTicket(t)
          if (t.status !== 'processing') {
            if (pollRef.current) clearInterval(pollRef.current)
          }
        } catch { /* ignore */ }
      }, 5000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [ticket?.ticket_id, ticket?.status])

  return (
    <>
      <style>{`
        @keyframes page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes blink { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes orb-float-pt { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-18px)} }

        .pt-root { animation: page-in .55s ease both; }

        .pt-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .pt-orb {
          position: absolute; border-radius: 50%;
          filter: blur(72px); opacity: .45;
          animation: orb-float-pt 16s ease-in-out infinite;
        }
        .pt-orb-a { width: 480px; height: 480px; top: -180px; left: -180px; background: radial-gradient(circle, #9DF0D6, transparent 70%); }
        .pt-orb-b { width: 420px; height: 420px; right: -140px; top: 180px; background: radial-gradient(circle, #FFD0BB, transparent 70%); animation-delay: -5s; }
        .pt-orb-c { width: 360px; height: 360px; left: 42%; bottom: -180px; background: radial-gradient(circle, #FFC7E0, transparent 70%); animation-delay: -10s; }

        .pt-input-focus:focus {
          background: #fff !important;
          border-color: #13B5A4 !important;
          box-shadow: 0 0 0 3.5px rgba(17,181,164,.13) !important;
        }
        .pt-textarea-focus:focus {
          background: #fff !important;
          border-color: #13B5A4 !important;
          box-shadow: 0 0 0 3.5px rgba(17,181,164,.13) !important;
        }

        .submit-btn-shine {
          position: relative; overflow: hidden;
          transition: transform .22s, box-shadow .22s !important;
        }
        .submit-btn-shine::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.28) 50%, transparent 70%);
          transform: translateX(-130%);
          transition: transform .6s;
        }
        .submit-btn-shine:hover { transform: translateY(-2px) !important; box-shadow: 0 18px 36px -12px rgba(255,107,110,.6) !important; }
        .submit-btn-shine:hover::after { transform: translateX(130%); }
        .submit-btn-shine:disabled { transform: none !important; }

        .track-btn-hover { transition: opacity .2s, transform .2s !important; }
        .track-btn-hover:hover { opacity: .9; transform: translateY(-1px); }
        .track-btn-hover:disabled { transform: none; opacity: .55; }

        .field-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 560px) { .field-row-grid { grid-template-columns: 1fr; } }

        .pt-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #10B981; display: inline-block; animation: blink 1.8s ease-in-out infinite; }

        .email-ticket-row:hover { box-shadow: 0 8px 24px -10px rgba(16,42,40,.18) !important; }

        .pt-bg::after {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(16,42,40,.055) 1px, transparent 1px);
          background-size: 38px 38px;
        }
      `}</style>

      {/* Background orbs */}
      <div className="pt-bg" aria-hidden="true">
        <div className="pt-orb pt-orb-a" />
        <div className="pt-orb pt-orb-b" />
        <div className="pt-orb pt-orb-c" />
      </div>

      <div className="pt-root" style={{ minHeight: '100vh', background: 'var(--ivory)', fontFamily: 'var(--font-body)', color: 'var(--ink)', position: 'relative', zIndex: 1 }}>
        {/* Nav shell — floating pill */}
        <div style={{ position: 'fixed', top: 14, left: 0, right: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '0 14px' }}>
          <nav style={{ width: 'min(1100px, 100%)', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 8px 14px', borderRadius: 60, background: 'rgba(255,255,255,.58)', backdropFilter: 'blur(22px) saturate(1.4)', WebkitBackdropFilter: 'blur(22px) saturate(1.4)', border: '1px solid rgba(255,255,255,.8)', boxShadow: '0 14px 40px -16px rgba(16,42,40,.25), inset 0 1px 0 rgba(255,255,255,.9)' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <Image src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png" alt="logo" width={36} height={36} style={{ borderRadius: '50%', boxShadow: '0 2px 10px rgba(17,181,164,.22)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, background: 'var(--g-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Navajeevana</div>
                <div style={{ fontSize: 10, color: 'var(--bk-muted)', letterSpacing: '.03em' }}>Ortho Hospitals · Healing Mobility</div>
              </div>
            </Link>
            <Link href="/" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--teal-d)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 30, transition: 'background .2s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(17,181,164,.1)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Back to Home
            </Link>
          </nav>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '130px 24px 80px' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#059669', background: 'rgba(16,185,129,.09)', border: '1px solid rgba(16,185,129,.2)', padding: '6px 14px', borderRadius: 30, marginBottom: 18 }}>
              <span className="pt-badge-dot" />
              Patient Support · 24 / 7
            </div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(30px,5vw,46px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.06, color: 'var(--ink)' }}>
              Care{' '}
              <span style={{ background: 'var(--g-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Hub</span>
            </h1>
            <p style={{ color: 'var(--bk-muted)', marginTop: 10, fontSize: 15, fontWeight: 500 }}>Ask our care team a question or track your existing query</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(16px)', borderRadius: 50, padding: 6, border: '1px solid rgba(255,255,255,.8)', boxShadow: '0 8px 30px -14px rgba(16,42,40,.18)' }}>
            {(['submit', 'track'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 40, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5,
                  background: tab === t ? 'var(--g-teal)' : 'transparent',
                  color: tab === t ? '#fff' : 'var(--bk-muted)',
                  boxShadow: tab === t ? '0 8px 22px -8px rgba(17,181,164,.55)' : 'none',
                  transition: 'all .28s cubic-bezier(.22,1,.36,1)',
                }}
              >
                {t === 'submit' ? '📝  Submit a Query' : '🔍  Track My Ticket'}
              </button>
            ))}
          </div>

          {/* Submit tab */}
          {tab === 'submit' && (
            <div style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(22px)', borderRadius: 28, padding: '36px 34px', border: '1px solid rgba(255,255,255,.8)', boxShadow: '0 24px 64px -28px rgba(16,42,40,.22), inset 0 1px 0 rgba(255,255,255,.9)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Tell Us How We Can Help</h2>
                  <p style={{ fontSize: 13.5, color: 'var(--bk-muted)', marginBottom: 10 }}>We&apos;ll review your query and respond within 24 hours.</p>
                </div>

                {/* Name + Phone side-by-side */}
                <div className="field-row-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label htmlFor="pt-name" className="pt-label">Full Name</label>
                    <input
                      id="pt-name"
                      type="text"
                      placeholder="Your full name"
                      required
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className="pt-input-focus"
                      style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.1)', fontSize: 14.5, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,.85)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s, box-shadow .2s, background .2s' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <label htmlFor="pt-phone" className="pt-label">
                      Phone{' '}
                      <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--bk-muted)', fontSize: 11 }}>(optional)</span>
                    </label>
                    <input
                      id="pt-phone"
                      type="tel"
                      placeholder="+91 99000 00000"
                      value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="pt-input-focus"
                      style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.1)', fontSize: 14.5, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,.85)', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s, box-shadow .2s, background .2s' }}
                    />
                  </div>
                </div>

                {/* Email — locked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label htmlFor="pt-email" className="pt-label">
                    Email Address
                    <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 600, color: 'var(--teal-d)', background: 'rgba(17,181,164,.1)', borderRadius: 20, padding: '2px 8px', textTransform: 'none', letterSpacing: 0 }}>
                      🔒 Linked to account
                    </span>
                  </label>
                  <input
                    id="pt-email"
                    type="email"
                    value={form.email}
                    readOnly
                    style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.07)', fontSize: 14.5, fontFamily: 'var(--font-body)', background: 'rgba(16,42,40,.04)', color: 'var(--bk-muted)', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: 11.5, color: 'var(--bk-muted)', marginTop: -2 }}>Your ticket and our reply will be sent to this address</span>
                </div>

                {/* Query */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <label htmlFor="pt-message" className="pt-label">Your Query</label>
                  <textarea
                    id="pt-message"
                    placeholder="Describe your concern, symptoms, or question in detail…"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    className="pt-textarea-focus"
                    style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.1)', fontSize: 14.5, fontFamily: 'var(--font-body)', background: 'rgba(255,255,255,.85)', color: 'var(--ink)', outline: 'none', resize: 'vertical', minHeight: 120, lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color .2s, box-shadow .2s, background .2s' }}
                  />
                </div>

                {submitError && (
                  <div style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, background: '#FEF2F2', border: '1px solid rgba(239,68,68,.18)', padding: '11px 15px', borderRadius: 12 }}>{submitError}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-btn-shine"
                  style={{ background: 'var(--g-warm)', color: '#fff', border: 'none', borderRadius: 40, padding: '15px 0', fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .6 : 1, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 28px -10px rgba(255,107,110,.55)', width: '100%' }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                  {submitting ? 'Submitting…' : 'Submit Query'}
                </button>
              </form>
            </div>
          )}

          {/* Track tab */}
          {tab === 'track' && (
            <div style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(22px)', borderRadius: 28, padding: '36px 34px', border: '1px solid rgba(255,255,255,.8)', boxShadow: '0 24px 64px -28px rgba(16,42,40,.22), inset 0 1px 0 rgba(255,255,255,.9)' }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 19, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Track Your Query</h2>
              <p style={{ fontSize: 13.5, color: 'var(--bk-muted)', marginBottom: 24 }}>Look up any ticket by ID or browse by email address.</p>

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(16,42,40,.05)', borderRadius: 30, padding: 4 }}>
                {(['id', 'email'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setTrackMode(m); setTicket(null); setTrackError(''); setEmailTickets(null); setEmailTrackError(''); }}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 26, border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                      background: trackMode === m ? '#fff' : 'transparent',
                      color: trackMode === m ? 'var(--teal-d)' : 'var(--bk-muted)',
                      boxShadow: trackMode === m ? '0 2px 10px rgba(16,42,40,.12)' : 'none',
                      transition: 'all .22s',
                    }}
                  >
                    {m === 'id' ? 'By Ticket ID' : 'By Email'}
                  </button>
                ))}
              </div>

              {/* ID mode */}
              {trackMode === 'id' && (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input
                      type="text"
                      aria-label="Ticket ID"
                      placeholder="e.g. NJH-2026-7842"
                      value={trackId}
                      onChange={(e) => setTrackId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                      className="pt-input-focus"
                      style={{ flex: 1, padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.1)', fontSize: 14.5, fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none', background: 'rgba(255,255,255,.85)', transition: 'border-color .2s, box-shadow .2s' }}
                    />
                    <button
                      onClick={handleTrack}
                      disabled={tracking}
                      className="track-btn-hover"
                      style={{ background: 'var(--g-teal)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 22px', fontWeight: 700, fontSize: 13.5, cursor: tracking ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 20px -8px rgba(17,181,164,.5)' }}
                    >
                      {tracking ? '…' : 'Track'}
                    </button>
                  </div>

                  {trackError && <div style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, background: '#FEF2F2', border: '1px solid rgba(239,68,68,.18)', padding: '11px 15px', borderRadius: 12, marginBottom: 16 }}>{trackError}</div>}

                  {ticket && (
                    <div style={{ animation: 'page-in .4s cubic-bezier(.22,1,.36,1)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--bk-muted)', marginBottom: 4 }}>Ticket ID</div>
                          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--teal-d)', letterSpacing: '.02em' }}>{ticket.ticket_id}</div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 700, background: statusLabel[ticket.status]?.color ?? 'rgba(107,114,128,.12)', color: statusTextColor[ticket.status] ?? '#374151' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusLabel[ticket.status]?.dot ?? '#9CA3AF', display: 'inline-block' }} />
                          {statusLabel[ticket.status]?.label ?? ticket.status}
                        </div>
                      </div>

                      {ticket.status === 'processing' && (
                        <div style={{ background: 'linear-gradient(140deg,#FFFBEC,#FFFDE8)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(245,158,11,.18)', fontSize: 13.5, fontWeight: 600, color: '#78350F', lineHeight: 1.6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'blink 1.4s infinite' }} />
                            ⏳ Our AI is reviewing your query — this usually takes under a minute.
                          </div>
                        </div>
                      )}
                      {ticket.status === 'pending_review' && (
                        <div style={{ background: 'linear-gradient(140deg,#EFF6FF,#F0F8FF)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(59,130,246,.18)', fontSize: 13.5, fontWeight: 600, color: '#1E3A8A', lineHeight: 1.6 }}>
                          ✅ AI has prepared a response. Our senior medical team is reviewing it before sending.
                        </div>
                      )}
                      {(ticket.status === 'escalated' || ticket.status === 'escalated_to_senior') && (
                        <div style={{ background: 'linear-gradient(140deg,#FEF2F2,#FFF5F5)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(239,68,68,.18)', fontSize: 13.5, fontWeight: 600, color: '#7F1D1D', lineHeight: 1.6 }}>
                          ⚠️ Your query has been escalated to our senior specialists. A doctor will contact you directly within 2 hours.
                        </div>
                      )}
                      {(ticket.status === 'approved' || ticket.status === 'emailed') && (
                        <div style={{ background: 'linear-gradient(140deg,#ECFDF5,#F0FDF6)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(16,185,129,.18)', fontSize: 13.5, fontWeight: 600, color: '#064E3B', lineHeight: 1.6 }}>
                          ✅ Our team has responded to your query. Please check your email at {ticket.customer_email}.
                        </div>
                      )}
                      {ticket.status === 'resolved' && (
                        <div style={{ background: 'linear-gradient(140deg,#F9FAFB,#F3F4F6)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(107,114,128,.18)', fontSize: 13.5, fontWeight: 600, color: '#1F2937', lineHeight: 1.6 }}>
                          ✔ This ticket has been resolved. If you have further questions, please submit a new query.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Email mode */}
              {trackMode === 'email' && (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <input
                      type="email"
                      aria-label="Your email address"
                      value={form.email}
                      readOnly
                      style={{ flex: 1, padding: '13px 16px', borderRadius: 14, border: '1.5px solid rgba(16,42,40,.07)', fontSize: 14.5, fontFamily: 'var(--font-body)', color: 'var(--bk-muted)', outline: 'none', background: 'rgba(16,42,40,.04)', cursor: 'not-allowed' }}
                    />
                    <button
                      onClick={handleEmailTrack}
                      disabled={emailTracking}
                      className="track-btn-hover"
                      style={{ background: 'var(--g-teal)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 22px', fontWeight: 700, fontSize: 13.5, cursor: emailTracking ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 20px -8px rgba(17,181,164,.5)' }}
                    >
                      {emailTracking ? '…' : 'View My Queries'}
                    </button>
                  </div>

                  {emailTrackError && <div style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, background: '#FEF2F2', border: '1px solid rgba(239,68,68,.18)', padding: '11px 15px', borderRadius: 12, marginBottom: 16 }}>{emailTrackError}</div>}

                  {emailTickets !== null && emailTickets.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--bk-muted)', padding: '24px 0', fontSize: 14 }}>
                      No queries found for this email.
                    </div>
                  )}

                  {emailTickets && emailTickets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--bk-muted)', fontWeight: 600, marginBottom: 4 }}>
                        {emailTickets.length} {emailTickets.length === 1 ? 'query' : 'queries'} found — click any to view details
                      </div>
                      {emailTickets.map((t) => (
                        <button
                          key={t.ticket_id}
                          onClick={() => { setTrackMode('id'); setTrackId(t.ticket_id); setTicket(t); }}
                          className="email-ticket-row"
                          style={{ textAlign: 'left', background: 'rgba(255,255,255,.8)', border: '1.5px solid rgba(16,42,40,.08)', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', width: '100%', transition: 'box-shadow .2s' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13.5, color: 'var(--teal-d)' }}>{t.ticket_id}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: statusLabel[t.status]?.color ?? 'rgba(107,114,128,.12)', color: statusTextColor[t.status] ?? '#374151', borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 700 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusLabel[t.status]?.dot ?? '#9CA3AF', display: 'inline-block' }} />
                              {statusLabel[t.status]?.label ?? t.status}
                            </span>
                          </div>
                          {t.subject && (
                            <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--bk-muted)' }}>
                            {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Trust row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              { icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V7z" /><path d="M9 12l2 2 4-4" /></svg>, label: 'HIPAA Compliant' },
              { icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={11} width={18} height={11} rx={2} /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>, label: 'End-to-End Encrypted' },
              { icon: <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" /></svg>, label: 'Response within 24 hrs' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--bk-muted)', fontWeight: 600 }}>
                <span style={{ color: '#10B981' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
