'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { submitTicket, getTicket, getTicketsByEmail, type Ticket } from '@/lib/api'

type Tab = 'submit' | 'track'

const statusLabel: Record<string, { label: string; color: string }> = {
  processing: { label: 'Processing', color: '#F59E0B' },
  pending_review: { label: 'Under Review', color: '#3B82F6' },
  approved: { label: 'Approved', color: '#10B981' },
  emailed: { label: 'Reply Sent', color: '#10B981' },
  escalated: { label: 'Escalated', color: '#EF4444' },
  escalated_to_senior: { label: 'Escalated', color: '#EF4444' },
  resolved: { label: 'Resolved', color: '#6B7280' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '1.5px solid var(--line)', fontSize: 14,
  fontFamily: 'var(--font-body)', background: '#fff',
  color: 'var(--ink)', outline: 'none', boxSizing: 'border-box',
}

const lockedInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#F3F4F6',
  color: 'var(--ink-2)',
  cursor: 'not-allowed',
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
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>
      {/* Nav */}
      <div style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)', padding: '14px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png" alt="logo" width={34} height={34} style={{ borderRadius: '50%' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, background: 'var(--g-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Navajeevana</div>
            <div style={{ fontSize: 10, color: 'var(--bk-muted)' }}>Ortho Hospitals</div>
          </div>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: 'var(--teal-d)', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</Link>
      </div>

      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 26px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, color: 'var(--ink)' }}>
            Patient <span style={{ background: 'var(--g-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Portal</span>
          </h1>
          <p style={{ color: 'var(--bk-muted)', marginTop: 10, fontSize: 15 }}>Submit a query or track your existing ticket</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(14px)', borderRadius: 50, padding: 6, border: '1px solid var(--line)' }}>
          {(['submit', 'track'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 40, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13.5,
                background: tab === t ? 'var(--g-teal)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--ink-2)',
                transition: 'all .25s',
              }}
            >
              {t === 'submit' ? 'Submit a Query' : 'Track My Ticket'}
            </button>
          ))}
        </div>

        {/* Submit tab */}
        {tab === 'submit' && (
          <div style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(14px)', borderRadius: 24, padding: '32px 28px', border: '1px solid var(--glass-brd)', boxShadow: 'var(--shadow-soft)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 4 }}>Tell Us How We Can Help</h2>

                {/* Full Name — editable, pre-filled */}
                <div>
                  <label htmlFor="pt-name" className="pt-label">Full Name</label>
                  <input
                    id="pt-name"
                    type="text"
                    placeholder="Your full name"
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                {/* Email — locked to Clerk account */}
                <div>
                  <label htmlFor="pt-email" className="pt-label">
                    Email Address
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--teal-d)', background: 'rgba(0,180,140,.08)', borderRadius: 20, padding: '2px 8px' }}>
                      🔒 Linked to account
                    </span>
                  </label>
                  <input
                    id="pt-email"
                    type="email"
                    value={form.email}
                    readOnly
                    style={lockedInputStyle}
                  />
                  <div style={{ fontSize: 11, color: 'var(--bk-muted)', marginTop: 4 }}>
                    Your tickets will be tracked and replied to at this address
                  </div>
                </div>

                {/* Phone — optional, editable */}
                <div>
                  <label htmlFor="pt-phone" className="pt-label">Phone Number (optional)</label>
                  <input
                    id="pt-phone"
                    type="tel"
                    placeholder="+91 99000 00000"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                {/* Query */}
                <div>
                  <label htmlFor="pt-message" className="pt-label">Your Query</label>
                  <textarea
                    id="pt-message"
                    placeholder="Describe your concern, symptoms, or question..."
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {submitError && <div style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>{submitError}</div>}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'var(--g-warm)', color: '#fff', border: 'none', borderRadius: 30, padding: '13px 0', fontWeight: 700, fontSize: 14.5, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? .7 : 1, fontFamily: 'var(--font-body)' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Query →'}
                </button>
              </form>
          </div>
        )}

        {/* Track tab */}
        {tab === 'track' && (
          <div style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(14px)', borderRadius: 24, padding: '32px 28px', border: '1px solid var(--glass-brd)', boxShadow: 'var(--shadow-soft)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 16 }}>Track Your Query</h2>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F3F4F6', borderRadius: 30, padding: 4 }}>
              {(['id', 'email'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setTrackMode(m); setTicket(null); setTrackError(''); setEmailTickets(null); setEmailTrackError(''); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 26, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                    background: trackMode === m ? '#fff' : 'transparent',
                    color: trackMode === m ? 'var(--teal-d)' : 'var(--bk-muted)',
                    boxShadow: trackMode === m ? '0 1px 4px rgba(0,0,0,.12)' : 'none',
                    transition: 'all .2s',
                  }}
                >
                  {m === 'id' ? 'By Ticket ID' : 'By Email'}
                </button>
              ))}
            </div>

            {/* ID mode */}
            {trackMode === 'id' && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                  <input
                    type="text"
                    aria-label="Ticket ID"
                    placeholder="Enter your Ticket ID"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--line)', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none' }}
                  />
                  <button
                    onClick={handleTrack}
                    disabled={tracking}
                    style={{ background: 'var(--g-teal)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 700, fontSize: 13.5, cursor: tracking ? 'not-allowed' : 'pointer', opacity: tracking ? .7 : 1, whiteSpace: 'nowrap' }}
                  >
                    {tracking ? '...' : 'Track'}
                  </button>
                </div>

                {trackError && <div style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{trackError}</div>}

                {ticket && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--bk-muted)', marginBottom: 4 }}>Ticket ID</div>
                        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--teal-d)' }}>{ticket.ticket_id}</div>
                      </div>
                      <div style={{ background: statusLabel[ticket.status]?.color ?? '#6B7280', color: '#fff', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                        {statusLabel[ticket.status]?.label ?? ticket.status}
                      </div>
                    </div>

                    {ticket.status === 'processing' && (
                      <div style={{ background: 'linear-gradient(140deg,#FFF9EC,#FFFBF0)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(245,158,11,.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#92400E', fontSize: 13, fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
                          Our AI is reviewing your query — this usually takes under a minute.
                        </div>
                      </div>
                    )}

                    {ticket.status === 'pending_review' && (
                      <div style={{ background: 'linear-gradient(140deg,#EFF6FF,#F0F7FF)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(59,130,246,.2)' }}>
                        <div style={{ color: '#1D4ED8', fontSize: 13, fontWeight: 600 }}>
                          ✓ AI has prepared a response. Our medical team is reviewing it before sending.
                        </div>
                      </div>
                    )}

                    {(ticket.status === 'escalated' || ticket.status === 'escalated_to_senior') && (
                      <div style={{ background: 'linear-gradient(140deg,#FEF2F2,#FFF5F5)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(239,68,68,.2)' }}>
                        <div style={{ color: '#991B1B', fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                          Your query has been escalated to our senior medical team.<br />
                          A specialist will contact you directly within 2 hours.
                        </div>
                      </div>
                    )}

                    {(ticket.status === 'approved' || ticket.status === 'emailed') && (
                      <div style={{ background: 'linear-gradient(140deg,#ECFDF5,#F0FDF4)', borderRadius: 14, padding: '16px 18px', border: '1px solid rgba(16,185,129,.2)' }}>
                        <div style={{ color: '#065F46', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                          ✓ Our team has responded to your query. Check your email at {ticket.customer_email}.
                        </div>
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
                    style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--line)', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink-2)', outline: 'none', background: '#F3F4F6', cursor: 'not-allowed' }}
                  />
                  <button
                    onClick={handleEmailTrack}
                    disabled={emailTracking}
                    style={{ background: 'var(--g-teal)', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontWeight: 700, fontSize: 13.5, cursor: emailTracking ? 'not-allowed' : 'pointer', opacity: emailTracking ? .7 : 1, whiteSpace: 'nowrap' }}
                  >
                    {emailTracking ? '...' : 'View My Queries'}
                  </button>
                </div>

                {emailTrackError && <div style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{emailTrackError}</div>}

                {emailTickets !== null && emailTickets.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--bk-muted)', padding: '24px 0', fontSize: 14 }}>
                    No queries found for this email.
                  </div>
                )}

                {emailTickets && emailTickets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--bk-muted)', marginBottom: 4 }}>{emailTickets.length} {emailTickets.length === 1 ? 'query' : 'queries'} found — click any to view details</div>
                    {emailTickets.map((t) => (
                      <button
                        key={t.ticket_id}
                        onClick={() => { setTrackMode('id'); setTrackId(t.ticket_id); setTicket(t); }}
                        style={{ textAlign: 'left', background: '#F8FAFC', border: '1.5px solid var(--line)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', width: '100%' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--teal-d)' }}>{t.ticket_id}</span>
                          <span style={{ background: statusLabel[t.status]?.color ?? '#6B7280', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                            {statusLabel[t.status]?.label ?? t.status}
                          </span>
                        </div>
                        {t.subject && (
                          <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </div>
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
      </div>
    </div>
  )
}
