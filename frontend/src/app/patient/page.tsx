'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { submitTicket, getTicket, type Ticket } from '@/lib/api'

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

export default function PatientPortal() {
  const [tab, setTab] = useState<Tab>('submit')

  // submit form
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ ticket_id: string } | null>(null)
  const [submitError, setSubmitError] = useState('')

  // track
  const [trackId, setTrackId] = useState('')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [tracking, setTracking] = useState(false)
  const [trackError, setTrackError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      setSubmitted(res)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
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
          <Image src="/assets/logo.png" alt="logo" width={34} height={34} style={{ borderRadius: '50%' }} />
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
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--g-teal)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} width={28} height={28}><path d="M5 12l5 5L20 7" /></svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, marginBottom: 10 }}>Query Submitted!</h2>
                <p style={{ color: 'var(--bk-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Our team will review your query and respond within 24 hours.
                </p>
                <div style={{ background: 'linear-gradient(140deg,#EEFBF5,#F3FBFF)', borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--bk-muted)', marginBottom: 6 }}>Your Ticket ID</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--teal-d)', letterSpacing: '.04em' }}>{submitted.ticket_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--bk-muted)', marginTop: 6 }}>Save this ID to track your query status</div>
                </div>
                <button
                  onClick={() => { setSubmitted(null); setForm({ name: '', email: '', phone: '', message: '' }); setTab('track'); setTrackId(submitted.ticket_id) }}
                  style={{ background: 'var(--g-teal)', color: '#fff', border: 'none', borderRadius: 30, padding: '11px 24px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                >
                  Track This Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 4 }}>Tell Us How We Can Help</h2>
                {[
                  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name', required: true },
                  { key: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: true },
                  { key: 'phone', label: 'Phone Number (optional)', type: 'tel', placeholder: '+91 99000 00000', required: false },
                ].map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      required={required}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--line)', fontSize: 14, fontFamily: 'var(--font-body)', background: '#fff', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Your Query</label>
                  <textarea
                    placeholder="Describe your concern, symptoms, or question..."
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid var(--line)', fontSize: 14, fontFamily: 'var(--font-body)', background: '#fff', color: 'var(--ink)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
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
            )}
          </div>
        )}

        {/* Track tab */}
        {tab === 'track' && (
          <div style={{ background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(14px)', borderRadius: 24, padding: '32px 28px', border: '1px solid var(--glass-brd)', boxShadow: 'var(--shadow-soft)' }}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, marginBottom: 20 }}>Track Your Query</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <input
                type="text"
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
          </div>
        )}
      </div>
    </div>
  )
}
