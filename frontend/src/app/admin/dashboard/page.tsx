'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  getPendingReview, getTicketReview, getAllTickets, getEscalationBrief,
  approveTicket, editTicket, sendEmail, resolveTicket,
  type Ticket, type TicketReview, type EscalationBrief,
} from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

type DashView = 'overview' | 'queue' | 'all' | 'escalations'
type EmailState = 'idle' | 'loading' | 'success' | 'error'

// ─── helpers ─────────────────────────────────────────────────────────────────

const urgencyColor: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' }
const routeColor: Record<string, string>   = { auto_reply: '#0D9488', web_search: '#3B82F6', escalate: '#EF4444' }
const routeLabel: Record<string, string>   = { auto_reply: 'Auto Reply', web_search: 'Web Search', escalate: 'Escalate' }
const statusColor: Record<string, string>  = {
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

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return <>{parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>)}</>
}

const BRIEF_HEADERS = ['ISSUE SUMMARY','PATIENT HISTORY','SAFETY FLAGS TRIGGERED','SUGGESTED ACTION','PATIENT SENTIMENT','URGENCY']
function parseEscalationBrief(text: string) {
  const results: { section: string; content: string }[] = []
  const pattern = new RegExp(`(${BRIEF_HEADERS.join('|')})`, 'g')
  const parts = text.split(pattern)
  for (let i = 1; i < parts.length; i += 2) results.push({ section: parts[i].trim(), content: (parts[i + 1] ?? '').trim() })
  return results.length > 0 ? results : [{ section: '', content: text }]
}

const URGENCY_EMOJI: Record<string, { color: string; bg: string }> = {
  '🔴': { color: '#991B1B', bg: '#FEF2F2' }, '🟠': { color: '#92400E', bg: '#FFF7ED' },
  '🟡': { color: '#78350F', bg: '#FFFBEB' }, '🟢': { color: '#065F46', bg: '#ECFDF5' },
}

function EscalationBriefPanel({ text }: { text: string }) {
  const sections = parseEscalationBrief(text)
  if (sections.length === 1 && sections[0].section === '') {
    return <div style={{ background: '#FEF2F2', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#1E293B', lineHeight: 1.65, border: '1px solid #FECACA', whiteSpace: 'pre-wrap' }}>{text}</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sections.map(({ section, content }) => {
        if (section === 'URGENCY') {
          const emojiKey = Object.keys(URGENCY_EMOJI).find(e => content.includes(e))
          const style = emojiKey ? URGENCY_EMOJI[emojiKey] : { color: '#475569', bg: '#F8FAFC' }
          return <div key={section} style={{ background: style.bg, border: `1px solid ${style.color}30`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', minWidth: 100 }}>Urgency</span><span style={{ fontSize: 14, fontWeight: 800, color: style.color }}>{content}</span></div>
        }
        if (section === 'SAFETY FLAGS TRIGGERED') {
          const flags = content.split(/[\n,]/).map(f => f.trim()).filter(Boolean)
          return <div key={section} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Safety Flags</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{flags.length > 0 && flags[0] !== 'None' && flags[0] !== 'N/A' ? flags.map((f, i) => <span key={i} style={{ background: '#EF4444', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{f}</span>) : <span style={{ color: '#64748B', fontSize: 12 }}>None triggered</span>}</div></div>
        }
        if (section === 'SUGGESTED ACTION') return <div key={section} style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#78350F', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Suggested Action</div><div style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, lineHeight: 1.5 }}>{content}</div></div>
        return <div key={section} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px' }}><div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{section}</div><div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{content}</div></div>
      })}
    </div>
  )
}

function AIDraftPanel({ draft, route }: { draft: string; route: string | null }) {
  const isWeb = draft.startsWith('[Web Search Result]')
  const isEsc = draft.toLowerCase().startsWith('dear patient') || draft.toLowerCase().startsWith('dear ')
  const borderColor = isEsc ? '#EF4444' : isWeb ? '#3B82F6' : '#0D9488'
  const badgeColor  = isEsc ? '#FEF2F2' : isWeb ? '#EFF6FF' : '#ECFDF5'
  const badgeText   = isEsc ? 'Escalation Reply' : isWeb ? '🌐 Web Source' : '✦ AI Draft'
  const badgeTxtC   = isEsc ? '#991B1B' : isWeb ? '#1D4ED8' : '#065F46'
  const wordCount   = draft.trim().split(/\s+/).length
  return (
    <div style={{ background: '#FAFAFA', borderRadius: 12, border: `1px solid ${borderColor}30`, borderLeft: `4px solid ${borderColor}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: badgeColor, borderBottom: `1px solid ${borderColor}20` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: badgeTxtC }}>{badgeText}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>~{wordCount} words</span>
      </div>
      <div style={{ padding: '14px 16px', fontSize: 13.5, color: '#1E293B', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}><RichText text={draft} /></div>
    </div>
  )
}

function Spinner() {
  return <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, iconBg, iconColor, icon }: { label: string; value: number; iconBg: string; iconColor: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '13px 14px', border: '1px solid #E9EFF4' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
          <div style={{ fontFamily: '"Sora",system-ui,sans-serif', fontSize: 28, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── overview dashboard ───────────────────────────────────────────────────────

function OverviewDashboard({ allTickets, onTicketClick }: { allTickets: Ticket[]; onTicketClick: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stats = useMemo(() => {
    const total = allTickets.length
    const escalatedCount = allTickets.filter(t => t.route === 'escalate' || t.status === 'escalated' || t.status === 'escalated_to_senior').length
    const autoResolved = allTickets.filter(t => t.status === 'emailed' || t.status === 'approved').length
    const inProgress = allTickets.filter(t => t.status === 'processing' || t.status === 'pending_review').length
    const uniquePatients = new Set(allTickets.map(t => t.customer_email).filter(Boolean)).size

    const autoReplyCount = allTickets.filter(t => t.route === 'auto_reply').length
    const webSearchCount = allTickets.filter(t => t.route === 'web_search').length
    const escalateCount  = allTickets.filter(t => t.route === 'escalate').length
    const pendingCount   = allTickets.filter(t => t.route === null).length

    const lowUrgency  = allTickets.filter(t => t.urgency === 'low').length
    const medUrgency  = allTickets.filter(t => t.urgency === 'medium').length
    const highUrgency = allTickets.filter(t => t.urgency === 'high').length

    const validConf = allTickets.filter(t => t.confidence_score != null)
    const avgConf = validConf.length > 0 ? validConf.reduce((s, t) => s + (t.confidence_score ?? 0), 0) / validConf.length : 0

    const autoRate = total > 0 ? Math.round(((autoReplyCount + webSearchCount) / total) * 100) : 0

    // Last 7 days trend
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d })
    const dayLabels = days.map(d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    const dayKeys   = days.map(d => d.toISOString().split('T')[0])
    const trendTotal = dayKeys.map(k => allTickets.filter(t => t.created_at?.startsWith(k)).length)
    const trendAuto  = dayKeys.map(k => allTickets.filter(t => t.created_at?.startsWith(k) && (t.route === 'auto_reply' || t.route === 'web_search')).length)
    const trendEsc   = dayKeys.map(k => allTickets.filter(t => t.created_at?.startsWith(k) && (t.route === 'escalate' || t.status?.includes('escalat'))).length)
    const trendInProg = dayKeys.map(k => allTickets.filter(t => t.created_at?.startsWith(k) && (t.status === 'processing' || t.status === 'pending_review')).length)

    return {
      total, escalatedCount, autoResolved, inProgress, uniquePatients,
      autoReplyCount, webSearchCount, escalateCount, pendingCount,
      lowUrgency, medUrgency, highUrgency, avgConf, autoRate,
      dayLabels, trendTotal, trendAuto, trendEsc, trendInProg,
    }
  }, [allTickets])

  const lineData = {
    labels: stats.dayLabels,
    datasets: [
      { label: 'Total', data: stats.trendTotal, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.06)', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#3B82F6', tension: 0.4, fill: true },
      { label: 'Auto-Resolved', data: stats.trendAuto, borderColor: '#10B981', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#10B981', tension: 0.4 },
      { label: 'Escalated', data: stats.trendEsc, borderColor: '#EF4444', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#EF4444', tension: 0.4 },
      { label: 'In Progress', data: stats.trendInProg, borderColor: '#8B5CF6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#8B5CF6', tension: 0.4 },
    ],
  }
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const, intersect: false, backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#475569', borderColor: '#E2E8F0', borderWidth: 1 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans,system-ui', size: 10 }, color: '#94A3B8' } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Plus Jakarta Sans,system-ui', size: 10 }, color: '#94A3B8' }, beginAtZero: true },
    },
  }

  const routeDonutData = {
    labels: ['Auto Reply', 'Web Search', 'Escalated', 'Pending'],
    datasets: [{ data: [stats.autoReplyCount, stats.webSearchCount, stats.escalateCount, stats.pendingCount], backgroundColor: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'], borderWidth: 2, borderColor: '#fff' }],
  }
  const urgencyDonutData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [{ data: [stats.highUrgency, stats.medUrgency, stats.lowUrgency], backgroundColor: ['#EF4444', '#F59E0B', '#10B981'], borderWidth: 2, borderColor: '#fff' }],
  }
  const donutOpts = { responsive: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#fff', titleColor: '#0F172A', bodyColor: '#475569', borderColor: '#E2E8F0', borderWidth: 1 } } }

  const confPct = Math.min(stats.avgConf * 100, 100)
  const arc = Math.PI * 57
  const filled = (confPct / 100) * arc

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        <StatCard label="Total Tickets" value={stats.total} iconBg="#EFF6FF" iconColor="#2563EB" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4M15 15h2"/></svg>} />
        <StatCard label="Escalated" value={stats.escalatedCount} iconBg="#FFF7ED" iconColor="#EA580C" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
        <StatCard label="Auto-Resolved" value={stats.autoResolved} iconBg="#F0FDF4" iconColor="#16A34A" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>} />
        <StatCard label="In Progress" value={stats.inProgress} iconBg="#FAF5FF" iconColor="#7C3AED" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <StatCard label="Unique Patients" value={stats.uniquePatients} iconBg="#F0FDFA" iconColor="#0D9488" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>} />
      </div>

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 260px', gap: 12 }}>
        {/* Line chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>Ticket Trend (Last 7 Days)</span>
          </div>
          <div style={{ height: 120 }}>
            {mounted && <Line data={lineData} options={lineOpts} />}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {[['#3B82F6','Total'],['#10B981','Auto-Resolved'],['#EF4444','Escalated'],['#8B5CF6','In Progress']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: '#64748B', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Route donut */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Tickets by Route</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              {mounted && <Doughnut data={routeDonutData} options={{ ...donutOpts, responsive: true }} width={100} height={100} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontFamily: '"Sora",system-ui', fontSize: 18, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{stats.total}</span>
                <span style={{ fontSize: 8, color: '#94A3B8', fontWeight: 600 }}>Total</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', width: '100%' }}>
              {[['#10B981','Auto Reply',stats.autoReplyCount],['#3B82F6','Web Search',stats.webSearchCount],['#EF4444','Escalated',stats.escalateCount],['#F59E0B','Pending',stats.pendingCount]].map(([c,l,n]) => (
                <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#475569', fontWeight: 500 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: String(c), flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 9.5, flexShrink: 0 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: urgency donut + urgency grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px', border: '1px solid #E9EFF4' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>AI Triage Decision</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 80 }}>
              <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                {mounted && <Doughnut data={routeDonutData} options={{ ...donutOpts, responsive: true }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['#10B981','Auto Reply',stats.autoReplyCount],['#EF4444','Escalated',stats.escalateCount],['#3B82F6','Web Search',stats.webSearchCount],['#F59E0B','Pending',stats.pendingCount]].map(([c,l,n]) => (
                  <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: '#475569', fontWeight: 500 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: String(c), flexShrink: 0 }} />
                    {l}
                    <span style={{ marginLeft: 'auto', paddingLeft: 6, fontWeight: 700, color: '#0F172A', fontSize: 9.5 }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px', border: '1px solid #E9EFF4' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Urgency Distribution</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
              {[
                { bg: '#FEF2F2', border: '#FECACA', lbl: 'High', lblC: '#DC2626', n: stats.highUrgency },
                { bg: '#FEFCE8', border: '#FDE68A', lbl: 'Medium', lblC: '#D97706', n: stats.medUrgency },
                { bg: '#F0FDF4', border: '#86EFAC', lbl: 'Low', lblC: '#16A34A', n: stats.lowUrgency },
              ].map(({ bg, border, lbl, lblC, n }) => (
                <div key={lbl} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '7px 5px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: lblC, marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontFamily: '"Sora",system-ui', fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 180px 1fr', gap: 12, paddingBottom: 2 }}>
        {/* Agent Performance */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>AI Agent Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { bg: '#F0FDF4', border: '#86EFAC', iC: '#16A34A', val: `${stats.autoRate}%`, lbl: 'Auto-Resolution Rate',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg> },
              { bg: '#EFF6FF', border: '#BFDBFE', iC: '#2563EB', val: `${stats.escalatedCount}`, lbl: 'Total Escalated',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> },
              { bg: '#FAF5FF', border: '#DDD6FE', iC: '#7C3AED', val: stats.avgConf > 0 ? stats.avgConf.toFixed(2) : '—', lbl: 'Avg Confidence',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> },
              { bg: '#FFF7ED', border: '#FDBA74', iC: '#EA580C', val: `${stats.autoResolved}`, lbl: 'Resolved',
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/></svg> },
            ].map(({ bg, border, iC, val, lbl, icon }) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 5 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, border: `2px solid ${border}`, color: iC }}>{icon}</div>
                <div style={{ fontFamily: '"Sora",system-ui', fontSize: 17, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, lineHeight: 1.3 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Confidence gauge */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 8, alignSelf: 'flex-start' }}>AI Confidence Score</div>
          <svg width="160" height="90" viewBox="0 0 160 90">
            <defs>
              <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444"/>
                <stop offset="45%" stopColor="#F59E0B"/>
                <stop offset="100%" stopColor="#10B981"/>
              </linearGradient>
            </defs>
            <path d="M20 80 A 57 57 0 0 1 140 80" fill="none" stroke="#F1F5F9" strokeWidth="14" strokeLinecap="round"/>
            {stats.avgConf > 0 && (
              <path d="M20 80 A 57 57 0 0 1 140 80" fill="none" stroke="url(#gGrad)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${filled} ${arc}`} strokeDashoffset="0"/>
            )}
            <text x="80" y="66" textAnchor="middle" fontFamily="Sora,system-ui" fontSize="22" fontWeight="900" fill="#0F172A">
              {stats.avgConf > 0 ? stats.avgConf.toFixed(2) : '—'}
            </text>
            <text x="80" y="80" textAnchor="middle" fontFamily="Plus Jakarta Sans,system-ui" fontSize="10" fill="#94A3B8">avg score</text>
            <text x="16" y="90" fontFamily="Plus Jakarta Sans,system-ui" fontSize="8" fill="#94A3B8">0</text>
            <text x="136" y="90" fontFamily="Plus Jakarta Sans,system-ui" fontSize="8" fill="#94A3B8">1.00</text>
          </svg>
          <div style={{ marginTop: 8, fontSize: 10.5, color: '#64748B', textAlign: 'center' }}>
            Based on <b>{allTickets.filter(t => t.confidence_score != null).length}</b> tickets
          </div>
          <div style={{ marginTop: 12, width: '100%' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>By Urgency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 60, height: 60, flexShrink: 0 }}>
                {mounted && <Doughnut data={urgencyDonutData} options={{ ...donutOpts, responsive: true }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[['#EF4444','High',stats.highUrgency],['#F59E0B','Medium',stats.medUrgency],['#10B981','Low',stats.lowUrgency]].map(([c,l,n]) => (
                  <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: '#6E817D' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: String(c) }} />{l}
                    <span style={{ marginLeft: 'auto', paddingLeft: 6, fontWeight: 700, color: '#0F172A' }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Base */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 6 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Knowledge Base</div>
          <svg viewBox="0 0 56 44" width="56" height="44">
            <rect x="0" y="4" width="20" height="36" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5"/>
            <rect x="18" y="0" width="20" height="40" rx="3" fill="#F0FDF4" stroke="#10B981" strokeWidth="1.5"/>
            <rect x="36" y="4" width="20" height="36" rx="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5"/>
          </svg>
          <div style={{ fontFamily: '"Sora",system-ui', fontSize: 20, fontWeight: 900, color: '#0F172A' }}>9 <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Collections</span></div>
          <div style={{ fontFamily: '"Sora",system-ui', fontSize: 18, fontWeight: 900, color: '#0F172A' }}>1280+ <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>Documents</span></div>
          <div style={{ fontSize: 9, color: '#94A3B8' }}>ChromaDB · Cosine Similarity</div>
        </div>

        {/* Agent Pipeline */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #E9EFF4' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Agent Pipeline Status</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            {['Orchestrator','Intent Classifier','Safety Checker','RAG Retriever','Confidence Eval','Reply / Escalate','Memory Manager'].map((step, i, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" width="11" height="11"><path d="M5 12l5 5L20 7"/></svg>
                  </div>
                  <div style={{ fontSize: 7.5, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>{step}</div>
                </div>
                {i < arr.length - 1 && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" width="10" height="10" style={{ marginBottom: 14 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#10B981', marginTop: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            All systems operational
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [dashView, setDashView] = useState<DashView>('overview')
  const [now, setNow] = useState<Date | null>(null)

  // HITL state
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

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== '1') {
      router.replace('/admin/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try { setQueue(await getPendingReview()) } catch { /* ignore */ } finally { setLoading(false) }
  }

  const loadAll = async () => {
    setLoading(true)
    try { setAllTickets(await getAllTickets()) } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!authChecked) return
    loadAll()
  }, [authChecked])

  useEffect(() => {
    if (!authChecked) return
    if (dashView === 'queue') loadQueue()
    else if (dashView === 'all' || dashView === 'escalations' || dashView === 'overview') loadAll()
  }, [dashView, authChecked])

  const selectTicket = async (id: string) => {
    setActionMsg(''); setActionErr(''); setBrief(null); setEditMode(false); setEmailState('idle'); setEmailError('')
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
    setEmailState('loading'); setEmailError('')
    try {
      await approveTicket(selected.ticket_id)
      await sendEmail(selected.ticket_id)
      setEmailState('success')
      flash('✓ Approved and email sent to patient.')
      setTimeout(() => { setSelected(null); setEmailState('idle'); loadQueue() }, 2500)
    } catch (e) { setEmailState('error'); setEmailError(e instanceof Error ? e.message : String(e)) }
  }

  const handleEdit = async () => {
    if (!selected || !editText.trim()) return
    setEmailState('loading'); setEmailError('')
    try {
      await editTicket(selected.ticket_id, editText)
      await sendEmail(selected.ticket_id)
      setEmailState('success')
      flash('✓ Edited reply sent to patient.')
      setTimeout(() => { setSelected(null); setEmailState('idle'); loadQueue() }, 2500)
    } catch (e) { setEmailState('error'); setEmailError(e instanceof Error ? e.message : String(e)) }
  }

  const handleEscalate = async () => {
    if (!selected) return
    try { setBrief(await getEscalationBrief(selected.ticket_id)) } catch (e) { flash(String(e), true) }
  }

  const handleResolve = async (id: string) => {
    try { await resolveTicket(id); flash('✓ Ticket resolved.'); loadAll() } catch (e) { flash(String(e), true) }
  }

  const escalated = allTickets.filter(t => t.route === 'escalate' || t.status === 'escalated' || t.status === 'escalated_to_senior')
  const displayTickets = dashView === 'escalations' ? escalated : allTickets

  const dateStr = now?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'long' }) ?? ''
  const timeStr = now?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) ?? ''

  if (!authChecked) return null

  const navItems = [
    { id: 'overview' as DashView, label: 'Dashboard', badge: null,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { id: 'queue' as DashView, label: 'Review Queue', badge: queue.length > 0 ? queue.length : null,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg> },
    { id: 'escalations' as DashView, label: 'Escalated', badge: escalated.length > 0 ? escalated.length : null,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { id: 'all' as DashView, label: 'All Tickets', badge: null,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4M15 15h2"/></svg> },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '"Plus Jakarta Sans",system-ui,sans-serif', background: '#F1F5F9' }}>

      {/* Sidebar */}
      <aside style={{ width: 224, flexShrink: 0, background: '#0D1B2A', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <Image src="/assets/logo.png" alt="logo" width={34} height={34} style={{ borderRadius: '50%' }} />
          <div>
            <strong style={{ display: 'block', fontFamily: '"Sora",system-ui', fontSize: 10.5, fontWeight: 800, color: '#13B5A4', lineHeight: 1.15 }}>Navajeevana<br/>Ortho Hospitals</strong>
            <span style={{ fontSize: 8.5, color: '#475569' }}>Admin Portal</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, label, badge, icon }) => {
            const active = dashView === id
            return (
              <button key={id} onClick={() => { setDashView(id); setSelected(null) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? 'linear-gradient(90deg,#1D4ED8,#2563EB)' : 'transparent',
                color: active ? '#fff' : '#94A3B8',
                fontSize: 11, fontWeight: active ? 700 : 600,
                boxShadow: active ? '0 4px 14px -4px rgba(37,99,235,.4)' : 'none',
                transition: 'all .15s', textAlign: 'left',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{icon}{label}</span>
                {badge != null && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(239,68,68,.18)', color: '#FCA5A5' }}>{badge}</span>}
              </button>
            )
          })}
          <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '5px 0' }} />
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, color: '#94A3B8', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Go to Website
          </a>
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#13B5A4,#0D9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>AD</div>
            <div>
              <strong style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.2 }}>ADMINNAVAJEEVANA</strong>
              <span style={{ fontSize: 8.5, color: '#64748B' }}>Administrator</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />Online
              </div>
            </div>
          </div>
          <button onClick={() => { sessionStorage.removeItem('adminAuth'); router.push('/admin/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', padding: 8, borderRadius: 8, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#FCA5A5', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="12" height="12"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 32, height: 32, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </div>
            <div>
              <strong style={{ fontFamily: '"Sora",system-ui', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Welcome back, <span style={{ color: '#2563EB' }}>ADMINNAVAJEEVANA</span></strong>
              <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>AI Powered Patient Support · Smart Triage · Better Care</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {now && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {dateStr}
                </div>
                <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, padding: '6px 11px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {timeStr}
                </div>
              </>
            )}
            <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', border: '1.5px solid #BFDBFE', color: '#2563EB', fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back to Portal
            </Link>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F0FDF4', border: '1.5px solid #BBF7D0', color: '#16A34A', fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Go to Website
            </Link>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {actionMsg && <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #A7F3D0' }}>{actionMsg}</div>}
          {actionErr && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #FECACA' }}>{actionErr}</div>}

          {/* OVERVIEW */}
          {dashView === 'overview' && (
            loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading dashboard...</div>
            ) : (
              <OverviewDashboard
                allTickets={allTickets}
                onTicketClick={(id) => { setDashView('queue'); selectTicket(id) }}
              />
            )
          )}

          {/* REVIEW QUEUE */}
          {dashView === 'queue' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              {!selected ? (
                /* ── QUEUE LIST ── */
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Review Queue</h2>
                      <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>AI-drafted replies awaiting your approval</p>
                    </div>
                    <button onClick={loadQueue} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
                  </div>
                  {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
                  ) : queue.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Queue is clear!</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>All tickets reviewed. Great work.</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          {['Ticket ID','Patient / Email','Phone','Query Preview','Urgency','AI Decision','Status','Submitted','Action'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queue.map(t => {
                          const created = new Date(t.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          const preview = t.original_message ? t.original_message.slice(0, 55) + (t.original_message.length > 55 ? '…' : '') : '—'
                          const statusActionLabel: Record<string, { label: string; color: string }> = {
                            pending_review: { label: 'Awaiting Review', color: '#3B82F6' },
                            approved: { label: 'Approved', color: '#10B981' },
                            emailed: { label: 'Email Sent ✓', color: '#10B981' },
                            escalated: { label: 'Escalated', color: '#EF4444' },
                            escalated_to_senior: { label: 'Escalated', color: '#EF4444' },
                            resolved: { label: 'Resolved', color: '#6B7280' },
                            processing: { label: 'Processing…', color: '#F59E0B' },
                          }
                          const sa = statusActionLabel[t.status] ?? { label: t.status, color: '#6B7280' }
                          return (
                            <tr key={t.ticket_id} onClick={() => selectTicket(t.ticket_id)} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: '#fff' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F0FDFA')}
                              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <td style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#0D9488', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t.ticket_id.slice(0, 12)}…</td>
                              <td style={{ padding: '10px 12px', minWidth: 140 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{t.customer_name}</div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{t.customer_email}</div>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 11.5, color: '#475569' }}>{t.customer_phone ?? '—'}</td>
                              <td style={{ padding: '10px 12px', fontSize: 12, color: '#334155', maxWidth: 200 }}>{preview}</td>
                              <td style={{ padding: '10px 12px' }}><Badge label={t.urgency} color={urgencyColor[t.urgency] ?? '#6B7280'} /></td>
                              <td style={{ padding: '10px 12px' }}>{t.route ? <Badge label={routeLabel[t.route] ?? t.route} color={routeColor[t.route] ?? '#6B7280'} /> : <span style={{ color: '#94A3B8', fontSize: 11 }}>Processing</span>}</td>
                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${sa.color}15`, color: sa.color, border: `1px solid ${sa.color}40`, borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sa.color, flexShrink: 0 }} />
                                  {sa.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>{created}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDFA', color: '#0D9488', border: '1px solid #99F6E4', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  Review →
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                /* ── FULL-WIDTH DETAIL VIEW ── */
                <div style={{ flex: 1, overflowY: 'auto', background: '#F1F5F9' }}>
                  {/* Top bar */}
                  <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
                    <button onClick={() => { setSelected(null); setBrief(null); setEmailState('idle'); setEditMode(false) }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                      ← Back to Queue
                    </button>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0D9488', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: '3px 8px' }}>{selected.ticket_id}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge label={selected.urgency} color={urgencyColor[selected.urgency] ?? '#6B7280'} />
                      {selected.route && <Badge label={routeLabel[selected.route] ?? selected.route} color={routeColor[selected.route] ?? '#6B7280'} />}
                      <Badge label={(selected.status ?? '').replace(/_/g, ' ')} color={statusColor[selected.status ?? ''] ?? '#6B7280'} />
                    </div>
                  </div>

                  {/* Two-column body */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, padding: '24px', maxWidth: 1180, margin: '0 auto' }}>

                    {/* LEFT — patient info + content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {/* Patient header card */}
                      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#13B5A4,#0E9F6E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{(selected.customer_name ?? '?')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{selected.customer_name ?? '—'}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: '#64748B' }}>
                            <span>✉ {selected.customer_email}</span>
                            {selected.customer_phone && <span>📞 {selected.customer_phone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Patient query card */}
                      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Patient Query</div>
                        <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.75, whiteSpace: 'pre-wrap', minHeight: 60 }}>
                          {selected.original_message || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No message text available</span>}
                        </div>
                      </div>

                      {/* Reply sent */}
                      {selected.final_sent_reply && (
                        <div style={{ background: '#ECFDF5', borderRadius: 14, border: '1px solid #A7F3D0', padding: '20px 24px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>✓ Reply Sent to Patient</div>
                          <div style={{ fontSize: 13.5, color: '#1E293B', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.final_sent_reply}</div>
                        </div>
                      )}

                      {/* AI draft / edit */}
                      {selected.ai_draft && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>AI Draft Reply</div>
                          {editMode ? (
                            <textarea aria-label="Edit reply text" placeholder="Edit the AI draft reply..." value={editText} onChange={e => setEditText(e.target.value)} rows={10}
                              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #0D9488', fontSize: 13.5, lineHeight: 1.7, resize: 'vertical', outline: 'none', color: '#1E293B', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                          ) : (
                            <AIDraftPanel draft={selected.ai_draft} route={selected.route} />
                          )}
                        </div>
                      )}

                      {/* Escalation brief */}
                      {brief && (
                        <div style={{ background: '#FFF5F5', borderRadius: 14, border: '1px solid #FECACA', padding: '20px 24px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Escalation Brief</div>
                          <EscalationBriefPanel text={brief.brief} />
                        </div>
                      )}
                    </div>

                    {/* RIGHT — meta + actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                      {/* Meta card */}
                      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>Ticket Details</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[
                            { lbl: 'Urgency', val: <Badge label={selected.urgency} color={urgencyColor[selected.urgency] ?? '#6B7280'} /> },
                            { lbl: 'AI Decision', val: selected.route ? <Badge label={routeLabel[selected.route] ?? selected.route} color={routeColor[selected.route] ?? '#6B7280'} /> : <span style={{ color: '#94A3B8', fontSize: 11 }}>—</span> },
                            { lbl: 'Status', val: <Badge label={(selected.status ?? '').replace(/_/g, ' ')} color={statusColor[selected.status ?? ''] ?? '#6B7280'} /> },
                            { lbl: 'Confidence', val: <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{selected.confidence_score != null ? (selected.confidence_score * 100).toFixed(0) + '%' : '—'}</span> },
                          ].map(({ lbl, val }) => (
                            <div key={lbl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>{lbl}</span>
                              {val}
                            </div>
                          ))}
                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Submitted</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{new Date(selected.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>

                      {/* Email state messages */}
                      {emailState === 'error' && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#991B1B' }}>
                          ⚠ Email failed: {emailError}
                          <button onClick={() => setEmailState('idle')} style={{ display: 'block', marginTop: 6, fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}>Retry</button>
                        </div>
                      )}
                      {emailState === 'success' && (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: '#065F46', fontWeight: 600 }}>
                          ✓ Email delivered to patient
                        </div>
                      )}

                      {/* Action buttons */}
                      {selected.status !== 'emailed' && selected.status !== 'resolved' && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Actions</div>
                          {!editMode ? (
                            <>
                              <button onClick={handleApprove} disabled={emailState === 'loading' || emailState === 'success'}
                                style={{ background: emailState === 'success' ? '#10B981' : emailState === 'loading' ? '#6B7280' : 'linear-gradient(120deg,#13B5A4,#0E9F6E)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13.5, cursor: emailState === 'loading' || emailState === 'success' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {emailState === 'loading' ? <><Spinner /> Sending…</> : emailState === 'success' ? '✓ Email Sent' : '✓ Approve & Send Email'}
                              </button>
                              <button onClick={() => setEditMode(true)} disabled={emailState === 'loading'}
                                style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                                ✎ Edit Reply &amp; Send
                              </button>
                              <button onClick={handleEscalate} disabled={emailState === 'loading'}
                                style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                                ↑ View Escalation Brief
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={handleEdit} disabled={emailState === 'loading' || emailState === 'success'}
                                style={{ background: emailState === 'success' ? '#10B981' : emailState === 'loading' ? '#6B7280' : 'linear-gradient(120deg,#3B82F6,#2563EB)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13.5, cursor: emailState === 'loading' || emailState === 'success' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                {emailState === 'loading' ? <><Spinner /> Sending…</> : emailState === 'success' ? '✓ Email Sent' : '✓ Send Edited Reply'}
                              </button>
                              <button onClick={() => { setEditMode(false); setEditText(selected.ai_draft ?? ''); setEmailState('idle') }} disabled={emailState === 'loading'}
                                style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Resolve button */}
                      {(selected.status === 'escalated' || selected.status === 'escalated_to_senior') && (
                        <button onClick={() => handleResolve(selected.ticket_id)}
                          style={{ background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', width: '100%' }}>
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL TICKETS / ESCALATIONS */}
          {(dashView === 'all' || dashView === 'escalations') && (
            <div>
              <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{dashView === 'all' ? 'All Tickets' : 'Escalations'}</h2>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{dashView === 'escalations' ? 'Tickets requiring senior medical attention' : 'All patient support tickets'}</p>
                </div>
                <button onClick={loadAll} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>↻ Refresh</button>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
              ) : displayTickets.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No tickets yet</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>Tickets will appear here once patients submit queries.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {['Ticket ID','Patient','Email','Urgency','Route','Status','Created',''].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTickets.map(t => {
                      const created = new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      return (
                        <tr key={t.ticket_id} style={{ borderBottom: '1px solid #F1F5F9', background: '#fff' }}>
                          <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>{t.ticket_id.slice(0, 12)}…</td>
                          <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{t.customer_name ?? '—'}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>{t.customer_email ?? '—'}</td>
                          <td style={{ padding: '12px 16px' }}><Badge label={t.urgency} color={urgencyColor[t.urgency] ?? '#6B7280'} /></td>
                          <td style={{ padding: '12px 16px' }}>{t.route ? <Badge label={routeLabel[t.route] ?? t.route} color={routeColor[t.route] ?? '#6B7280'} /> : '—'}</td>
                          <td style={{ padding: '12px 16px' }}><Badge label={t.status} color={statusColor[t.status] ?? '#6B7280'} /></td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>{created}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {(t.status === 'escalated' || t.status === 'escalated_to_senior') && (
                              <button onClick={() => handleResolve(t.ticket_id)} style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Resolve</button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
