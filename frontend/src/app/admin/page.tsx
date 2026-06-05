'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  getPendingReview,
  getTicketReview,
  getAllTickets,
  getEscalationBrief,
  approveTicket,
  editTicket,
  sendEmail,
  assignTicket,
  resolveTicket,
  type Ticket,
  type TicketReview,
  type EscalationBrief,
} from '@/lib/api'

type View = 'queue' | 'all' | 'escalations'
type EmailState = 'idle' | 'loading' | 'success' | 'error'

const urgencyColor = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' }
const routeColor = { auto_reply: '#0D9488', web_search: '#3B82F6', escalate: '#EF4444' }
const routeLabel = { auto_reply: 'Auto Reply', web_search: 'Web Search', escalate: 'Escalate' }
const statusColor: Record<string, string> = {
  processing: '#F59E0B', pending_review: '#3B82F6', approved: '#10B981',
  emailed: '#10B981', escalated: '#EF4444', escalated_to_senior: '#EF4444', resolved: '#6B7280',
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: 'inline-block', background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// Render bold markdown (**text**) as <strong>
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

const BRIEF_HEADERS = [
  'ISSUE SUMMARY', 'PATIENT HISTORY', 'SAFETY FLAGS TRIGGERED',
  'SUGGESTED ACTION', 'PATIENT SENTIMENT', 'URGENCY',
]

function parseEscalationBrief(text: string): { section: string; content: string }[] {
  const results: { section: string; content: string }[] = []
  const pattern = new RegExp(`(${BRIEF_HEADERS.join('|')})`, 'g')
  const parts = text.split(pattern)
  for (let i = 1; i < parts.length; i += 2) {
    results.push({ section: parts[i].trim(), content: (parts[i + 1] ?? '').trim() })
  }
  return results.length > 0 ? results : [{ section: '', content: text }]
}

const URGENCY_EMOJI: Record<string, { color: string; bg: string }> = {
  '🔴': { color: '#991B1B', bg: '#FEF2F2' },
  '🟠': { color: '#92400E', bg: '#FFF7ED' },
  '🟡': { color: '#78350F', bg: '#FFFBEB' },
  '🟢': { color: '#065F46', bg: '#ECFDF5' },
}

function EscalationBriefPanel({ text }: { text: string }) {
  const sections = parseEscalationBrief(text)

  if (sections.length === 1 && sections[0].section === '') {
    return (
      <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#1E293B', lineHeight: 1.65, border: '1px solid #FECACA', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sections.map(({ section, content }) => {
        if (section === 'URGENCY') {
          const emojiKey = Object.keys(URGENCY_EMOJI).find(e => content.includes(e))
          const style = emojiKey ? URGENCY_EMOJI[emojiKey] : { color: '#475569', bg: '#F8FAFC' }
          return (
            <div key={section} style={{ background: style.bg, border: `1px solid ${style.color}30`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', minWidth: 100 }}>Urgency</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: style.color }}>{content}</span>
            </div>
          )
        }
        if (section === 'SAFETY FLAGS TRIGGERED') {
          const flags = content.split(/[\n,]/).map(f => f.trim()).filter(Boolean)
          return (
            <div key={section} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Safety Flags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {flags.length > 0 && flags[0] !== 'None' && flags[0] !== 'N/A' ? flags.map((f, i) => (
                  <span key={i} style={{ background: '#EF4444', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{f}</span>
                )) : (
                  <span style={{ color: '#64748B', fontSize: 12 }}>None triggered</span>
                )}
              </div>
            </div>
          )
        }
        if (section === 'SUGGESTED ACTION') {
          return (
            <div key={section} style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#78350F', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Suggested Action</div>
              <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, lineHeight: 1.5 }}>{content}</div>
            </div>
          )
        }
        return (
          <div key={section} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{section}</div>
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{content}</div>
          </div>
        )
      })}
    </div>
  )
}

function AIDraftPanel({ draft, route }: { draft: string; route: string | null }) {
  const isWeb = draft.startsWith('[Web Search Result]')
  const isEscalation = draft.toLowerCase().startsWith('dear patient') || draft.toLowerCase().startsWith('dear ')
  const borderColor = isEscalation ? '#EF4444' : isWeb ? '#3B82F6' : '#0D9488'
  const badgeColor = isEscalation ? '#FEF2F2' : isWeb ? '#EFF6FF' : '#ECFDF5'
  const badgeText = isEscalation ? 'Escalation Reply' : isWeb ? '🌐 Web Source' : '✦ AI Draft'
  const badgeTextColor = isEscalation ? '#991B1B' : isWeb ? '#1D4ED8' : '#065F46'
  const wordCount = draft.trim().split(/\s+/).length

  return (
    <div style={{ background: '#FAFAFA', borderRadius: 12, border: `1px solid ${borderColor}30`, borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: badgeColor, borderBottom: `1px solid ${borderColor}20` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: badgeTextColor }}>{badgeText}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>~{wordCount} words</span>
      </div>
      <div style={{ padding: '14px 16px', fontSize: 13.5, color: '#1E293B', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        <RichText text={draft} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [view, setView] = useState<View>('queue')
  const [queue, setQueue] = useState<TicketReview[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<TicketReview | null>(null)
  const [brief, setBrief] = useState<EscalationBrief | null>(null)
  const [editText, setEditText] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [emailState, setEmailState] = useState<EmailState>('idle')
  const [emailError, setEmailError] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    try { setQueue(await getPendingReview()) } catch { /* ignore */ } finally { setLoading(false) }
  }

  const loadAll = async () => {
    setLoading(true)
    try { setAllTickets(await getAllTickets()) } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => {
    if (view === 'queue') loadQueue()
    else if (view === 'all' || view === 'escalations') loadAll()
  }, [view])

  const selectTicket = async (id: string) => {
    setActionMsg(''); setActionErr(''); setBrief(null); setEditMode(false)
    setEmailState('idle'); setEmailError('')
    const t = await getTicketReview(id)
    setSelected(t)
    setEditText(t.ai_draft ?? '')
  }

  const flash = (msg: string, err = false) => {
    if (err) setActionErr(msg); else setActionMsg(msg)
    setTimeout(() => { setActionMsg(''); setActionErr('') }, 4000)
  }

  const handleApprove = async () => {
    if (!selected) return
    setEmailState('loading')
    setEmailError('')
    try {
      await approveTicket(selected.ticket_id)
      await sendEmail(selected.ticket_id)
      setEmailState('success')
      flash('✓ Approved and email sent to patient.')
      setTimeout(() => { setSelected(null); setEmailState('idle'); loadQueue() }, 2500)
    } catch (e) {
      setEmailState('error')
      setEmailError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleEdit = async () => {
    if (!selected || !editText.trim()) return
    setEmailState('loading')
    setEmailError('')
    try {
      await editTicket(selected.ticket_id, editText)
      await sendEmail(selected.ticket_id)
      setEmailState('success')
      flash('✓ Edited reply sent to patient.')
      setTimeout(() => { setSelected(null); setEmailState('idle'); loadQueue() }, 2500)
    } catch (e) {
      setEmailState('error')
      setEmailError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleEscalate = async () => {
    if (!selected) return
    try {
      const b = await getEscalationBrief(selected.ticket_id)
      setBrief(b)
    } catch (e) { flash(String(e), true) }
  }

  const handleResolve = async (id: string) => {
    try {
      await resolveTicket(id)
      flash('✓ Ticket resolved.')
      loadAll()
    } catch (e) { flash(String(e), true) }
  }

  const escalated = allTickets.filter((t) => t.status === 'escalated' || t.status === 'escalated_to_senior')
  const displayTickets = view === 'escalations' ? escalated : allTickets

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#0F172A', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,.08)', textDecoration: 'none' }}>
          <Image src="/assets/logo.png" alt="logo" width={32} height={32} style={{ borderRadius: '50%' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#E2E8F0' }}>Navajeevana</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Admin Portal</div>
          </div>
        </Link>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {([
            { id: 'queue', label: 'Review Queue', count: queue.length },
            { id: 'all', label: 'All Tickets' },
            { id: 'escalations', label: 'Escalations' },
          ] as { id: View; label: string; count?: number }[]).map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => { setView(id); setSelected(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4,
                background: view === id ? 'rgba(13,148,136,.25)' : 'transparent',
                color: view === id ? '#5EEAD4' : '#94A3B8',
                fontSize: 13.5, fontWeight: view === id ? 700 : 500, textAlign: 'left',
                transition: 'all .2s',
              }}
            >
              {label}
              {count != null && count > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>← Back to Website</Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {view === 'queue' ? 'Review Queue' : view === 'all' ? 'All Tickets' : 'Escalations'}
            </h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              {view === 'queue' ? 'AI-drafted replies awaiting your approval' : view === 'escalations' ? 'Tickets requiring senior medical attention' : 'All patient support tickets'}
            </p>
          </div>
          <button onClick={() => view === 'queue' ? loadQueue() : loadAll()} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>

        {actionMsg && <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 28px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #A7F3D0' }}>{actionMsg}</div>}
        {actionErr && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 28px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #FECACA' }}>{actionErr}</div>}

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Ticket list */}
          <div style={{ flex: selected ? '0 0 380px' : 1, overflowY: 'auto', borderRight: selected ? '1px solid #E2E8F0' : 'none' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
            ) : (view === 'queue' ? queue : displayTickets).length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                  {view === 'queue' ? 'Queue is clear!' : 'No tickets yet'}
                </div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  {view === 'queue' ? 'All tickets reviewed. Great work.' : 'Tickets will appear here once patients submit queries.'}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    {['Ticket ID', 'Patient', 'Urgency', 'Route / Status', 'Created', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(view === 'queue' ? queue : displayTickets).map((t) => {
                    const id = 'ticket_id' in t ? t.ticket_id : (t as Ticket).ticket_id
                    const name = 'customer_name' in t ? (t as TicketReview).customer_name : ''
                    const urgency = t.urgency as string
                    const route = (t as TicketReview).route ?? (t as Ticket).route
                    const status = (t as Ticket).status
                    const created = new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    const isSelected = selected?.ticket_id === id
                    return (
                      <tr
                        key={id}
                        onClick={() => selectTicket(id)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: isSelected ? '#F0FDFA' : '#fff', transition: 'background .15s' }}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>{id.slice(0, 12)}…</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge label={urgency} color={urgencyColor[urgency as keyof typeof urgencyColor] ?? '#6B7280'} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {view === 'queue' && route ? (
                            <Badge label={routeLabel[route as keyof typeof routeLabel] ?? route} color={routeColor[route as keyof typeof routeColor] ?? '#6B7280'} />
                          ) : (
                            <Badge label={status} color={statusColor[status] ?? '#6B7280'} />
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>{created}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: '#0D9488', fontSize: 12, fontWeight: 600 }}>Review →</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{selected.customer_name}</h2>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{selected.customer_email}</div>
                </div>
                <button onClick={() => { setSelected(null); setBrief(null); setEmailState('idle') }} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748B' }}>×</button>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                <Badge label={selected.urgency} color={urgencyColor[selected.urgency as keyof typeof urgencyColor] ?? '#6B7280'} />
                {selected.route && <Badge label={routeLabel[selected.route as keyof typeof routeLabel] ?? selected.route} color={routeColor[selected.route as keyof typeof routeColor] ?? '#6B7280'} />}
                <Badge label={selected.status} color={statusColor[selected.status] ?? '#6B7280'} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Patient Message</div>
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', fontSize: 13.5, color: '#1E293B', lineHeight: 1.65, border: '1px solid #E2E8F0' }}>
                  {selected.original_message}
                </div>
              </div>

              {selected.ai_draft && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>AI Draft Reply</div>
                  {editMode ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={8}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #0D9488', fontSize: 13.5, lineHeight: 1.65, resize: 'vertical', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <AIDraftPanel draft={selected.ai_draft} route={selected.route} />
                  )}
                </div>
              )}

              {brief && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Escalation Brief</div>
                  <EscalationBriefPanel text={brief.brief} />
                </div>
              )}

              {/* Email send feedback */}
              {emailState === 'error' && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#991B1B' }}>
                  ⚠ Email failed: {emailError}
                  <button onClick={() => setEmailState('idle')} style={{ marginLeft: 10, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
                </div>
              )}

              {emailState === 'success' && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#065F46', fontWeight: 600 }}>
                  ✓ Email delivered to patient successfully
                </div>
              )}

              {/* Action buttons */}
              {selected.status === 'pending_review' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {!editMode ? (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={emailState === 'loading' || emailState === 'success'}
                        style={{
                          background: emailState === 'success' ? '#10B981' : emailState === 'loading' ? '#6B7280' : 'linear-gradient(120deg,#13B5A4,#0E9F6E)',
                          color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0',
                          fontWeight: 700, fontSize: 14, cursor: emailState === 'loading' || emailState === 'success' ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'background .3s',
                        }}
                      >
                        {emailState === 'loading' ? (
                          <><Spinner /> Sending Email…</>
                        ) : emailState === 'success' ? (
                          '✓ Email Sent'
                        ) : (
                          '✓ Approve & Send Email'
                        )}
                      </button>
                      <button
                        onClick={() => setEditMode(true)}
                        disabled={emailState === 'loading'}
                        style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: emailState === 'loading' ? .5 : 1 }}
                      >
                        ✎ Edit Reply & Send
                      </button>
                      <button
                        onClick={handleEscalate}
                        disabled={emailState === 'loading'}
                        style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: emailState === 'loading' ? .5 : 1 }}
                      >
                        ↑ View Escalation Brief
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        disabled={emailState === 'loading' || emailState === 'success'}
                        style={{
                          background: emailState === 'success' ? '#10B981' : emailState === 'loading' ? '#6B7280' : 'linear-gradient(120deg,#3B82F6,#2563EB)',
                          color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0',
                          fontWeight: 700, fontSize: 14, cursor: emailState === 'loading' || emailState === 'success' ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {emailState === 'loading' ? (
                          <><Spinner /> Sending Email…</>
                        ) : emailState === 'success' ? (
                          '✓ Email Sent'
                        ) : (
                          '✓ Send Edited Reply'
                        )}
                      </button>
                      <button
                        onClick={() => { setEditMode(false); setEditText(selected.ai_draft ?? ''); setEmailState('idle') }}
                        disabled={emailState === 'loading'}
                        style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}

              {(selected.status === 'escalated' || selected.status === 'escalated_to_senior') && (
                <button
                  onClick={() => handleResolve(selected.ticket_id)}
                  style={{ width: '100%', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
  )
}
