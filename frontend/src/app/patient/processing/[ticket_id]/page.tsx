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
  { id: 'orchestrator',         label: 'Intake Coordinator',   icon: '🏥', row: 0 },
  { id: 'intent_classifier',    label: 'Intent Classifier',    icon: '🧠', row: 1, col: 0 },
  { id: 'safety_checker',       label: 'Safety Checker',       icon: '🛡️', row: 1, col: 1 },
  { id: 'rag_retriever',        label: 'Knowledge Base',       icon: '📚', row: 1, col: 2 },
  { id: 'confidence_evaluator', label: 'Confidence Eval',      icon: '⚖️', row: 2 },
  { id: 'tavily_search',        label: 'Web Search',           icon: '🌐', row: 3, col: 0 },
  { id: 'reply_writer',         label: 'Reply Writer',         icon: '✍️', row: 3, col: 1 },
  { id: 'escalation_packager',  label: 'Escalation',           icon: '🚨', row: 3, col: 2 },
  { id: 'memory_manager',       label: 'Memory Manager',       icon: '💾', row: 4 },
]

const PIPELINE_ORDER = PIPELINE.map(n => n.id)

const AGENT_COLORS: Record<string, string> = {
  orchestrator:         '#0D9488',
  intent_classifier:    '#8B5CF6',
  safety_checker:       '#F97316',
  rag_retriever:        '#3B82F6',
  confidence_evaluator: '#F59E0B',
  reply_writer:         '#10B981',
  escalation_packager:  '#EF4444',
  tavily_search:        '#06B6D4',
  memory_manager:       '#6366F1',
}

const routeBadge: Record<string, { label: string; color: string; bg: string }> = {
  auto_reply: { label: 'Auto Reply — Knowledge Base', color: '#065F46', bg: '#ECFDF5' },
  web_search: { label: 'Web Search — General Info',   color: '#1D4ED8', bg: '#EFF6FF' },
  escalate:   { label: 'Escalated — Medical Review',  color: '#991B1B', bg: '#FEF2F2' },
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
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)

  // stagger-reveal all nodes on mount
  useEffect(() => {
    PIPELINE.forEach((node, i) => {
      setTimeout(() => {
        setVisibleNodes(prev => new Set([...prev, node.id]))
      }, 120 + i * 80)
    })
  }, [])

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
    const lastDoneIdx = PIPELINE_ORDER.reduce((acc, id, i) => doneIds.has(id) ? i : acc, -1)
    const thisIdx = PIPELINE_ORDER.indexOf(nodeId)
    if (thisIdx === lastDoneIdx + 1 && phase === 'running') return 'running'
    return 'waiting'
  }

  function logFor(nodeId: string): AgentLog | undefined {
    return logs.find(l => l.node_name === nodeId)
  }

  function isBranchVisible(nodeId: string): boolean {
    if (!routeDecision && !doneIds.has(nodeId)) return true
    if (nodeId === 'tavily_search')       return routeDecision === 'web_search' || !routeDecision
    if (nodeId === 'reply_writer')        return routeDecision !== 'escalate' || doneIds.has('reply_writer')
    if (nodeId === 'escalation_packager') return routeDecision === 'escalate' || doneIds.has('escalation_packager')
    return true
  }

  const parallelRow1 = PIPELINE.filter(n => n.row === 1)
  const branchRow    = PIPELINE.filter(n => n.row === 3).filter(n => isBranchVisible(n.id))

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: 'var(--font-body)', color: '#0F2A28', position: 'relative', overflow: 'hidden' }}>

      {/* Background orbs + dot grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="proc-orb proc-orb-a" />
        <div className="proc-orb proc-orb-b" />
        <div className="proc-orb proc-orb-c" />
        <div className="proc-dotgrid" />
      </div>

      {/* Floating pill nav */}
      <div style={{ position: 'fixed', top: 14, left: 0, right: 0, zIndex: 60, display: 'flex', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{
          width: 'min(720px,calc(100% - 0px))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px 8px 16px',
          borderRadius: 60,
          background: 'rgba(255,255,255,.58)',
          backdropFilter: 'blur(22px) saturate(1.4)',
          border: '1px solid rgba(255,255,255,.8)',
          boxShadow: '0 14px 40px -16px rgba(16,42,40,.25), inset 0 1px 0 rgba(255,255,255,.9)',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image
              src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png"
              alt="logo" width={32} height={32}
              style={{ borderRadius: '50%' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, background: 'var(--g-teal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Navajeevana</div>
              <div style={{ fontSize: 9, color: '#6E817D', lineHeight: 1 }}>Ortho Hospitals</div>
            </div>
          </Link>
          <Link
            href="/patient"
            style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--teal-d)', textDecoration: 'none', padding: '7px 14px', borderRadius: 30, transition: 'background .2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(13,148,136,.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ← Care Hub
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '108px 20px 90px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {phase === 'running' ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)', borderRadius: 30, padding: '6px 14px', marginBottom: 18 }}>
                <span className="proc-live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '.07em' }}>AI Processing</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.13, marginBottom: 10, color: '#0F2A28' }}>
                Our AI is{' '}
                <em style={{ fontStyle: 'normal', background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  reviewing
                </em>{' '}
                your query
              </h1>
              <p style={{ color: '#6E817D', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
                Watch our 8-agent pipeline work in real time. This usually takes under a minute.
              </p>
            </>
          ) : phase === 'timeout' ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(24px,4vw,30px)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 8, color: '#0F2A28' }}>Still working…</h1>
              <p style={{ color: '#6E817D', fontSize: 14, fontWeight: 500 }}>This is taking longer than usual. Your query is still being processed.</p>
            </>
          ) : (
            <>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#13B5A4,#0E9F6E)', display: 'grid', placeItems: 'center', margin: '0 auto 18px', boxShadow: '0 12px 36px rgba(13,148,136,.35)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.8} width={30} height={30}><path d="M5 12l5 5L20 7" /></svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.13, marginBottom: 10, color: '#0F2A28' }}>
                Analysis{' '}
                <em style={{ fontStyle: 'normal', background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Complete!
                </em>
              </h1>
              <p style={{ color: '#6E817D', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
                AI has prepared a response. Your query is now with our medical team for review.
              </p>
            </>
          )}
        </div>

        {/* Ticket ID chip */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ display: 'inline-block', background: 'rgba(13,148,136,.07)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 20, padding: '6px 20px', fontSize: 12.5, fontWeight: 700, color: 'var(--teal-d)', letterSpacing: '.05em', fontFamily: 'var(--font-head)' }}>
            {ticket_id}
          </span>
        </div>

        {/* Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Row 0: Orchestrator */}
          <AgentNode node={PIPELINE[0]} state={nodeState('orchestrator')} log={logFor('orchestrator')} visible={visibleNodes.has('orchestrator')} size={100} />
          <Connector active={doneIds.has('orchestrator')} />

          {/* Parallel label */}
          {(doneIds.has('orchestrator') || nodeState('intent_classifier') === 'running') && (
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9BADA9', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6, animation: 'proc-fade-up .4s ease forwards' }}>
              Running in parallel
            </div>
          )}

          {/* Row 1: 3 parallel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, width: '100%', justifyItems: 'center' }}>
            {parallelRow1.map(n => (
              <AgentNode key={n.id} node={n} state={nodeState(n.id)} log={logFor(n.id)} visible={visibleNodes.has(n.id)} size={80} />
            ))}
          </div>
          <Connector active={parallelRow1.every(n => doneIds.has(n.id))} />

          {/* Row 2: Confidence evaluator */}
          <AgentNode node={PIPELINE.find(n => n.id === 'confidence_evaluator')!} state={nodeState('confidence_evaluator')} log={logFor('confidence_evaluator')} visible={visibleNodes.has('confidence_evaluator')} size={100} />
          <Connector active={doneIds.has('confidence_evaluator')} />

          {/* Row 3: Branch */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${branchRow.length}, 1fr)`, gap: 16, width: '100%', justifyItems: 'center' }}>
            {branchRow.map(n => (
              <AgentNode key={n.id} node={n} state={nodeState(n.id)} log={logFor(n.id)} visible={visibleNodes.has(n.id)} size={80} dim={!isBranchVisible(n.id)} />
            ))}
          </div>
          <Connector active={branchRow.some(n => doneIds.has(n.id))} />

          {/* Row 4: Memory manager */}
          <AgentNode node={PIPELINE.find(n => n.id === 'memory_manager')!} state={nodeState('memory_manager')} log={logFor('memory_manager')} visible={visibleNodes.has('memory_manager')} size={100} />
        </div>

        {/* Completion card */}
        {phase === 'complete' && (
          <div className="proc-completion-card" style={{
            marginTop: 44,
            background: 'rgba(255,255,255,.78)',
            backdropFilter: 'blur(24px)',
            borderRadius: 28,
            padding: '30px 26px',
            border: '1px solid rgba(255,255,255,.88)',
            boxShadow: '0 24px 64px -28px rgba(16,42,40,.2), inset 0 1px 0 rgba(255,255,255,.9)',
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9BADA9', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>Result Summary</div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {routeDecision && routeBadge[routeDecision] && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: routeBadge[routeDecision].bg, color: routeBadge[routeDecision].color, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                  {routeDecision === 'auto_reply' ? '✓' : routeDecision === 'escalate' ? '↑' : '🌐'} {routeBadge[routeDecision].label}
                </span>
              )}
              {confidenceScore != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,42,40,.05)', color: '#475569', border: '1px solid rgba(16,42,40,.08)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
                  Confidence: {Math.round(confidenceScore * 100)}%
                </span>
              )}
            </div>

            {confidenceScore != null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9BADA9', marginBottom: 7 }}>
                  <span>AI Confidence Score</span>
                  <span style={{ fontWeight: 700, color: '#0F2A28' }}>{Math.round(confidenceScore * 100)}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(16,42,40,.07)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(confidenceScore * 100)}%`,
                    background: confidenceScore >= 0.7
                      ? 'linear-gradient(90deg,#13B5A4,#0E9F6E)'
                      : confidenceScore >= 0.5
                        ? 'linear-gradient(90deg,#F59E0B,#FBBF24)'
                        : 'linear-gradient(90deg,#EF4444,#F87171)',
                    borderRadius: 99,
                    transition: 'width 1.3s cubic-bezier(.22,1,.36,1) .25s',
                  }} />
                </div>
              </div>
            )}

            <div style={{ background: 'linear-gradient(140deg,#EFF6FF,#F0F8FF)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(59,130,246,.18)', marginBottom: 24 }}>
              <div style={{ color: '#1D4ED8', fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>🩺 Under Medical Team Review</div>
              <div style={{ color: '#3B82F6', fontSize: 13, lineHeight: 1.6 }}>
                Your query has been processed and is now with our medical team. They will review the AI response and send you a reply to your email shortly.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/patient?tab=track&id=${ticket_id}`}
                style={{ flex: 1, background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)', color: '#fff', borderRadius: 30, padding: '12px 0', fontWeight: 700, fontSize: 13.5, textAlign: 'center', textDecoration: 'none', display: 'block', boxShadow: '0 8px 24px rgba(13,148,136,.3)' }}
              >
                Track This Ticket
              </Link>
              <Link
                href="/patient"
                style={{ flex: 1, background: 'rgba(16,42,40,.06)', color: '#475569', borderRadius: 30, padding: '12px 0', fontWeight: 600, fontSize: 13.5, textAlign: 'center', textDecoration: 'none', display: 'block' }}
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
              style={{ display: 'inline-block', background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)', color: '#fff', borderRadius: 30, padding: '12px 28px', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 24px rgba(13,148,136,.3)' }}
            >
              Check Status in Patient Portal →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .proc-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: .55;
          animation: proc-orb-float 14s ease-in-out infinite;
        }
        .proc-orb-a {
          width: 500px; height: 500px;
          top: -140px; left: -160px;
          background: radial-gradient(circle, #9DF0D6, transparent 70%);
        }
        .proc-orb-b {
          width: 440px; height: 440px;
          right: -130px; top: 200px;
          background: radial-gradient(circle, #FFC9A3, transparent 70%);
          animation-delay: -4s;
        }
        .proc-orb-c {
          width: 380px; height: 380px;
          left: 38%; bottom: -160px;
          background: radial-gradient(circle, #FFD0BB, transparent 70%);
          animation-delay: -8s;
        }
        .proc-dotgrid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(16,42,40,.055) 1px, transparent 1px);
          background-size: 38px 38px;
        }
        .proc-live-dot {
          animation: proc-ldot 1.3s ease-in-out infinite;
        }
        .proc-completion-card {
          animation: proc-fade-up .7s cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes proc-orb-float {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(24px,-22px); }
        }
        @keyframes proc-ldot {
          0%,100% { opacity:.3; transform:scale(.8); }
          50%     { opacity:1;  transform:scale(1.25); }
        }
        @keyframes proc-spin-arc {
          to { transform: rotate(360deg); }
        }
        @keyframes proc-circle-pulse {
          0%,100% { box-shadow: 0 4px 20px -6px rgba(16,42,40,.14), 0 0 0 3px var(--proc-ac); }
          50%     { box-shadow: 0 4px 20px -6px rgba(16,42,40,.14), 0 0 0 8px var(--proc-ac); }
        }
        @keyframes proc-ripple-burst {
          from { opacity:.7; transform:scale(1);   }
          to   { opacity:0;  transform:scale(1.65); }
        }
        @keyframes proc-fade-up {
          from { opacity:0; transform:translateY(6px);  }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes proc-node-in {
          from { opacity:0; transform:scale(.55) translateY(18px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
      `}</style>
    </div>
  )
}

/* ── Connector ─────────────────────────────────────────── */
function Connector({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'relative', width: 2, height: 36, margin: '2px 0', background: 'rgba(16,42,40,.08)', borderRadius: 1, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom,#0D9488,#6EE7B7)',
        borderRadius: 1,
        transform: active ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'top',
        transition: 'transform .65s cubic-bezier(.22,1,.36,1)',
      }} />
    </div>
  )
}

/* ── AgentNode ─────────────────────────────────────────── */
function AgentNode({
  node,
  state,
  log,
  visible,
  size,
  dim = false,
}: {
  node: PipelineNode
  state: NodeState
  log?: AgentLog
  visible: boolean
  size: number
  dim?: boolean
}) {
  const color = AGENT_COLORS[node.id] ?? '#0D9488'

  const ringSize = size + 16
  const iconSize = size * 0.38

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      opacity: visible ? (dim ? 0.35 : 1) : 0,
      transform: visible ? 'scale(1) translateY(0)' : 'scale(.55) translateY(18px)',
      transition: 'opacity .52s cubic-bezier(.22,1,.36,1), transform .52s cubic-bezier(.22,1,.36,1)',
    }}>
      {/* Ring wrapper */}
      <div style={{
        position: 'relative',
        width: ringSize,
        height: ringSize,
        display: 'grid',
        placeItems: 'center',
        // CSS custom property for pulse animation
        ['--proc-ac' as string]: color + '40',
      }}>
        {/* Track ring — always visible */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '4px solid rgba(16,42,40,.07)',
        }} />

        {/* Spinning arc — running only */}
        {state === 'running' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `4px solid transparent`,
            borderTopColor: color,
            borderRightColor: color + '60',
            animation: 'proc-spin-arc .85s linear infinite',
          }} />
        )}

        {/* Done ring */}
        {state === 'done' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '4px solid #10B981',
          }} />
        )}

        {/* Ripple burst on done */}
        {state === 'done' && (
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid #10B981',
            animation: 'proc-ripple-burst .7s ease-out .35s forwards',
          }} />
        )}

        {/* Inner white circle */}
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: state === 'running'
            ? `0 4px 20px -6px rgba(16,42,40,.14), 0 0 0 3px ${color}30`
            : '0 4px 20px -6px rgba(16,42,40,.14)',
          animation: state === 'running' ? 'proc-circle-pulse 2s ease-in-out infinite' : 'none',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          zIndex: 2,
          transition: 'box-shadow .35s ease',
        }}>
          <span style={{
            fontSize: iconSize,
            opacity: state === 'waiting' ? 0.4 : state === 'done' ? 0.55 : 1,
            filter: state === 'done' ? 'grayscale(.3)' : 'none',
            transition: 'opacity .35s',
          }}>
            {node.icon}
          </span>
        </div>

        {/* Checkmark badge — done only */}
        {state === 'done' && (
          <div style={{
            position: 'absolute',
            bottom: 2, right: 2,
            zIndex: 4,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#10B981,#0D9488)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 3px 12px rgba(16,185,129,.55)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.2} width={size * 0.16} height={size * 0.16}>
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Label + status */}
      <div style={{ textAlign: 'center', maxWidth: ringSize + 20 }}>
        <div style={{
          fontSize: size === 80 ? 11 : 12,
          fontWeight: 700,
          color: state === 'waiting' ? '#9BADA9' : '#0F2A28',
          fontFamily: 'var(--font-head)',
          lineHeight: 1.2,
          marginBottom: 2,
        }}>
          {node.label}
        </div>
        {log ? (
          <div style={{ fontSize: 10, color: '#6E817D', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: ringSize + 20 }}>
            {decisionSummary(node.id, log.decision)}
          </div>
        ) : state === 'running' ? (
          <div style={{ fontSize: 10, color, fontWeight: 700 }}>Analyzing…</div>
        ) : null}
      </div>
    </div>
  )
}
