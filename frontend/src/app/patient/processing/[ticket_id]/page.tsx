'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTicketProgress, type AgentLog } from '@/lib/api'

type NodeState = 'waiting' | 'running' | 'done'

interface PipelineNode {
  id: string
  label: string
  icon: string
  row: number
  col?: number
}

const PIPELINE: PipelineNode[] = [
  { id: 'orchestrator',        label: 'Intake Coordinator',   icon: '🏥', row: 0 },
  { id: 'intent_classifier',   label: 'Intent Classifier',    icon: '🧠', row: 1, col: 0 },
  { id: 'safety_checker',      label: 'Safety Checker',       icon: '🛡️', row: 1, col: 1 },
  { id: 'rag_retriever',       label: 'Knowledge Base',       icon: '📚', row: 1, col: 2 },
  { id: 'confidence_evaluator',label: 'Confidence Evaluator', icon: '⚖️', row: 2 },
  { id: 'tavily_search',       label: 'Web Search',           icon: '🌐', row: 3, col: 0 },
  { id: 'reply_writer',        label: 'Reply Writer',         icon: '✍️', row: 3, col: 1 },
  { id: 'escalation_packager', label: 'Escalation Packager',  icon: '🚨', row: 3, col: 2 },
  { id: 'memory_manager',      label: 'Memory Manager',       icon: '💾', row: 4 },
]

const PIPELINE_ORDER = PIPELINE.map(n => n.id)

const routeBadge: Record<string, { label: string; color: string; bg: string }> = {
  auto_reply: { label: 'Auto Reply — Knowledge Base',   color: '#065F46', bg: '#ECFDF5' },
  web_search: { label: 'Web Search — General Info',     color: '#1D4ED8', bg: '#EFF6FF' },
  escalate:   { label: 'Escalated — Medical Review',    color: '#991B1B', bg: '#FEF2F2' },
}

function decisionSummary(nodeId: string, decision: string): string {
  if (nodeId === 'orchestrator')         return `Urgency: ${decision}`
  if (nodeId === 'intent_classifier')    return `Category: ${decision}`
  if (nodeId === 'safety_checker')       return decision === 'safe' ? 'No safety flags' : `⚠ ${decision}`
  if (nodeId === 'rag_retriever')        return `RAG ${decision}`
  if (nodeId === 'confidence_evaluator') return `Route: ${decision}`
  if (nodeId === 'tavily_search')        return `Web: ${decision}`
  if (nodeId === 'reply_writer')         return 'Reply drafted'
  if (nodeId === 'escalation_packager')  return 'Brief prepared for staff'
  if (nodeId === 'memory_manager')       return 'Patient memory updated'
  return decision
}

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>
}) {
  const { ticket_id } = use(params)

  const [logs, setLogs] = useState<AgentLog[]>([])
  const [status, setStatus] = useState<string>('processing')
  const [routeDecision, setRouteDecision] = useState<string | null>(null)
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
  const [phase, setPhase] = useState<'running' | 'complete' | 'timeout'>('running')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getTicketProgress(ticket_id)
        setLogs(data.logs)
        setStatus(data.status)
        if (data.route_decision) setRouteDecision(data.route_decision)
        if (data.confidence_score != null) setConfidenceScore(data.confidence_score)
        if (data.status !== 'processing') {
          if (pollRef.current) clearInterval(pollRef.current)
          setPhase('complete')
        }
      } catch {
        // ignore transient errors
      }
    }

    poll()
    pollRef.current = setInterval(() => {
      elapsedRef.current += 1.5
      if (elapsedRef.current >= 120) {
        if (pollRef.current) clearInterval(pollRef.current)
        setPhase('timeout')
        return
      }
      poll()
    }, 1500)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [ticket_id])

  const doneIds = new Set(logs.map(l => l.node_name))

  function nodeState(nodeId: string): NodeState {
    if (doneIds.has(nodeId)) return 'done'
    // find the last completed node in pipeline order and check if this is next
    const lastDoneIdx = PIPELINE_ORDER.reduce((acc, id, i) => doneIds.has(id) ? i : acc, -1)
    const thisIdx = PIPELINE_ORDER.indexOf(nodeId)
    if (thisIdx === lastDoneIdx + 1 && phase === 'running') return 'running'
    return 'waiting'
  }

  function logFor(nodeId: string): AgentLog | undefined {
    return logs.find(l => l.node_name === nodeId)
  }

  // Determine which branch nodes to show based on route
  function isBranchVisible(nodeId: string): boolean {
    if (!routeDecision && !doneIds.has(nodeId)) return true // show all until route known
    if (nodeId === 'tavily_search')       return routeDecision === 'web_search' || !routeDecision
    if (nodeId === 'reply_writer')        return routeDecision !== 'escalate' || doneIds.has('reply_writer')
    if (nodeId === 'escalation_packager') return routeDecision === 'escalate' || doneIds.has('escalation_packager')
    return true
  }

  const singleNodes = PIPELINE.filter(n => n.col === undefined)
  const parallelRow1 = PIPELINE.filter(n => n.row === 1)
  const branchRow   = PIPELINE.filter(n => n.row === 3).filter(n => isBranchVisible(n.id))

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
        <Link href="/patient" style={{ fontSize: 13, color: 'var(--teal-d)', textDecoration: 'none', fontWeight: 600 }}>← Patient Portal</Link>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {phase === 'running' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6', display: 'inline-block', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '.06em' }}>AI Processing</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, marginBottom: 10 }}>
                Our AI is reviewing your query
              </h1>
              <p style={{ color: 'var(--bk-muted)', fontSize: 14, lineHeight: 1.6 }}>
                Watch our 8-agent pipeline work in real time. This usually takes under a minute.
              </p>
            </>
          ) : phase === 'timeout' ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Still working…</h1>
              <p style={{ color: 'var(--bk-muted)', fontSize: 14 }}>This is taking longer than usual. Your query is still being processed.</p>
            </>
          ) : (
            <>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--g-teal)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} width={30} height={30}><path d="M5 12l5 5L20 7" /></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(22px,4vw,30px)', fontWeight: 700, marginBottom: 10 }}>
                Analysis Complete!
              </h1>
              <p style={{ color: 'var(--bk-muted)', fontSize: 14, lineHeight: 1.6 }}>
                AI has prepared a response. Your query is now with our medical team for review.
              </p>
            </>
          )}
        </div>

        {/* Ticket ID chip */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ display: 'inline-block', background: 'rgba(13,148,136,.08)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 700, color: 'var(--teal-d)', letterSpacing: '.04em', fontFamily: 'var(--font-head)' }}>
            {ticket_id}
          </span>
        </div>

        {/* Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Row 0: Orchestrator */}
          <NodeCard node={PIPELINE[0]} state={nodeState('orchestrator')} log={logFor('orchestrator')} />
          <Connector active={doneIds.has('orchestrator')} />

          {/* Row 1: 3 parallel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%' }}>
            {parallelRow1.map(n => (
              <NodeCard key={n.id} node={n} state={nodeState(n.id)} log={logFor(n.id)} compact />
            ))}
          </div>
          <Connector active={parallelRow1.every(n => doneIds.has(n.id))} />

          {/* Row 2: Confidence evaluator */}
          <NodeCard node={PIPELINE.find(n => n.id === 'confidence_evaluator')!} state={nodeState('confidence_evaluator')} log={logFor('confidence_evaluator')} />
          <Connector active={doneIds.has('confidence_evaluator')} />

          {/* Row 3: Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${branchRow.length}, 1fr)`, gap: 12, width: '100%' }}>
            {branchRow.map(n => (
              <NodeCard key={n.id} node={n} state={nodeState(n.id)} log={logFor(n.id)} compact dim={!isBranchVisible(n.id)} />
            ))}
          </div>
          <Connector active={branchRow.some(n => doneIds.has(n.id))} />

          {/* Row 4: Memory manager */}
          <NodeCard node={PIPELINE.find(n => n.id === 'memory_manager')!} state={nodeState('memory_manager')} log={logFor('memory_manager')} />
        </div>

        {/* Completion card */}
        {phase === 'complete' && (
          <div style={{ marginTop: 40, background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(14px)', borderRadius: 20, padding: '28px 24px', border: '1px solid var(--glass-brd)', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bk-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>Result Summary</div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {routeDecision && routeBadge[routeDecision] && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: routeBadge[routeDecision].bg, color: routeBadge[routeDecision].color, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                  {routeDecision === 'auto_reply' ? '✓' : routeDecision === 'escalate' ? '↑' : '🌐'} {routeBadge[routeDecision].label}
                </span>
              )}
              {confidenceScore != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                  Confidence: {Math.round(confidenceScore * 100)}%
                </span>
              )}
            </div>

            {confidenceScore != null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--bk-muted)', marginBottom: 6 }}>
                  <span>AI Confidence Score</span>
                  <span style={{ fontWeight: 700 }}>{Math.round(confidenceScore * 100)}%</span>
                </div>
                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(confidenceScore * 100)}%`, background: confidenceScore >= 0.7 ? 'var(--g-teal)' : confidenceScore >= 0.5 ? 'linear-gradient(90deg,#F59E0B,#FBBF24)' : 'linear-gradient(90deg,#EF4444,#F87171)', borderRadius: 99, transition: 'width 1s ease' }} />
                </div>
              </div>
            )}

            <div style={{ background: 'linear-gradient(140deg,#EFF6FF,#F0F7FF)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(59,130,246,.2)', marginBottom: 24 }}>
              <div style={{ color: '#1D4ED8', fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>
                🩺 Under Medical Team Review
              </div>
              <div style={{ color: '#3B82F6', fontSize: 13, lineHeight: 1.6 }}>
                Your query has been processed and is now with our medical team. They will review the AI response and send you a reply to your email shortly.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/patient?tab=track&id=${ticket_id}`}
                style={{ flex: 1, background: 'var(--g-teal)', color: '#fff', borderRadius: 30, padding: '11px 0', fontWeight: 700, fontSize: 13.5, textAlign: 'center', textDecoration: 'none', display: 'block' }}
              >
                Track This Ticket
              </Link>
              <Link
                href="/patient"
                style={{ flex: 1, background: '#F1F5F9', color: '#475569', borderRadius: 30, padding: '11px 0', fontWeight: 600, fontSize: 13.5, textAlign: 'center', textDecoration: 'none', display: 'block' }}
              >
                Submit Another Query
              </Link>
            </div>
          </div>
        )}

        {/* Timeout fallback */}
        {phase === 'timeout' && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <Link
              href={`/patient?tab=track&id=${ticket_id}`}
              style={{ display: 'inline-block', background: 'var(--g-teal)', color: '#fff', borderRadius: 30, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
            >
              Check Status in Patient Portal →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:.4;transform:scale(1.4)}
        }
        @keyframes spin-ring {
          to{transform:rotate(360deg)}
        }
      `}</style>
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
      <div style={{ width: 2, height: 24, background: active ? '#0D9488' : '#E2E8F0', transition: 'background .4s', borderRadius: 1 }} />
    </div>
  )
}

function NodeCard({
  node,
  state,
  log,
  compact = false,
  dim = false,
}: {
  node: PipelineNode
  state: NodeState
  log?: AgentLog
  compact?: boolean
  dim?: boolean
}) {
  const borderColor =
    state === 'done'    ? '#0D9488' :
    state === 'running' ? '#3B82F6' :
    '#E2E8F0'

  const bgColor =
    state === 'done'    ? 'linear-gradient(140deg,#ECFDF5,#F0FDFA)' :
    state === 'running' ? 'linear-gradient(140deg,#EFF6FF,#F0F7FF)' :
    '#fff'

  return (
    <div style={{
      width: compact ? 'auto' : 280,
      maxWidth: '100%',
      margin: compact ? 0 : '0 auto',
      background: bgColor,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 16,
      padding: compact ? '12px 14px' : '16px 20px',
      opacity: dim ? 0.4 : 1,
      transition: 'all .35s ease',
      boxShadow: state === 'running' ? '0 0 0 3px rgba(59,130,246,.15)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: compact ? 18 : 22 }}>{node.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? 12 : 13.5, fontWeight: 700, color: state === 'waiting' ? '#94A3B8' : '#0F172A', fontFamily: 'var(--font-head)' }}>
            {node.label}
          </div>
          {log && (
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {decisionSummary(node.id, log.decision)}
            </div>
          )}
          {state === 'running' && !log && (
            <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 3, fontWeight: 600 }}>Analyzing…</div>
          )}
        </div>
        <StatusIcon state={state} />
      </div>
    </div>
  )
}

function StatusIcon({ state }: { state: NodeState }) {
  if (state === 'done') {
    return (
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0D9488', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} width={12} height={12}><path d="M5 12l5 5L20 7" /></svg>
      </div>
    )
  }
  if (state === 'running') {
    return (
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid #BFDBFE', borderTopColor: '#3B82F6', flexShrink: 0, animation: 'spin-ring .8s linear infinite' }} />
    )
  }
  return (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#F1F5F9', border: '2px solid #E2E8F0', flexShrink: 0 }} />
  )
}
