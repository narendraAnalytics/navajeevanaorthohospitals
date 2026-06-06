'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOGO = 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png'

export default function SubmitTransitionPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>
}) {
  const { ticket_id } = use(params)
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 3200)
    const t2 = setTimeout(() => router.push(`/patient/processing/${ticket_id}`), 3850)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [router, ticket_id])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .st-root {
          position: fixed; inset: 0;
          background: #FFFBF7;
          display: flex; align-items: center; justify-content: center;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        /* ---- orbs ---- */
        .st-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .st-bg::after {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(16,42,40,.055) 1px, transparent 1px);
          background-size: 38px 38px;
        }
        .st-orb {
          position: absolute; border-radius: 50%;
          filter: blur(70px); opacity: .55;
          animation: st-orb-float 14s ease-in-out infinite;
        }
        .st-orb-a { width: 500px; height: 500px; top: -140px; left: -160px; background: radial-gradient(circle, #9DF0D6, transparent 70%); }
        .st-orb-b { width: 440px; height: 440px; right: -130px; top: 200px;  background: radial-gradient(circle, #FFC9A3, transparent 70%); animation-delay: -4s; }
        .st-orb-c { width: 380px; height: 380px; left: 38%; bottom: -160px;  background: radial-gradient(circle, #FFD0BB, transparent 70%); animation-delay: -8s; }
        @keyframes st-orb-float {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(24px, -22px); }
        }

        /* ---- stage ---- */
        .st-stage {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; gap: 36px;
        }

        /* ---- ring wrap ---- */
        .st-ring-wrap {
          position: relative; width: 190px; height: 190px;
          display: flex; align-items: center; justify-content: center;
        }

        /* glow halo */
        .st-ring-glow {
          position: absolute; width: 160px; height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(17,181,164,.25) 0%, transparent 70%);
          animation: st-glow-pulse 2.8s ease-in-out infinite;
        }
        @keyframes st-glow-pulse {
          0%, 100% { transform: scale(1); opacity: .55; }
          50%       { transform: scale(1.16); opacity: 1; }
        }

        /* ripple rings */
        .st-rpl {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(17,181,164,.22);
          animation: st-rpl-anim 3.2s ease-out infinite;
        }
        .st-rpl-1 { width: 210px; height: 210px; animation-delay: 0s; }
        .st-rpl-2 { width: 260px; height: 260px; animation-delay: 1.1s; }
        .st-rpl-3 { width: 310px; height: 310px; animation-delay: 2.2s; }
        @keyframes st-rpl-anim {
          0%   { transform: scale(.68); opacity: .6; }
          100% { transform: scale(1);   opacity: 0; }
        }

        /* outer spinning ring (slow, coral arc) */
        .st-ring-outer {
          position: absolute; width: 190px; height: 190px;
          animation: st-spin-slow 3s linear infinite;
        }
        /* inner spinning ring (fast, teal arc, reverse) */
        .st-ring-inner {
          position: absolute; width: 152px; height: 152px;
          animation: st-spin-fast 1.6s linear infinite reverse;
        }
        @keyframes st-spin-slow { to { transform: rotate(360deg); } }
        @keyframes st-spin-fast { to { transform: rotate(360deg); } }

        .st-r-outer-track { fill: none; stroke: rgba(17,181,164,.12); stroke-width: 3; }
        .st-r-outer-arc   {
          fill: none; stroke: url(#st-rg-coral); stroke-width: 4;
          stroke-linecap: round; stroke-dasharray: 220 290;
        }
        .st-r-inner-arc   {
          fill: none; stroke: url(#st-rg-teal); stroke-width: 3;
          stroke-linecap: round; stroke-dasharray: 100 180;
        }

        /* logo */
        .st-logo {
          position: relative; z-index: 2;
          width: 100px; height: 100px; border-radius: 50%;
          opacity: 0; transform: scale(.55);
          box-shadow:
            0 16px 44px rgba(16,42,40,.18),
            0 0 0 5px rgba(17,181,164,.18),
            0 0 0 10px rgba(17,181,164,.07);
          animation: st-logo-in .75s cubic-bezier(.34,1.56,.64,1) .1s forwards;
        }
        @keyframes st-logo-in { to { opacity: 1; transform: scale(1); } }

        /* coral AI badge */
        .st-ai-badge {
          position: absolute; bottom: 6px; right: 6px; z-index: 3;
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #FF8A65 0%, #FF6B7E 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; line-height: 1;
          box-shadow: 0 6px 24px rgba(255,107,110,.45), 0 0 0 4px #FFFBF7, 0 0 0 6px rgba(255,138,101,.22);
          opacity: 0; transform: scale(0) rotate(-70deg);
          animation: st-badge-in .55s cubic-bezier(.34,1.56,.64,1) 1.8s forwards;
        }
        @keyframes st-badge-in { to { opacity: 1; transform: scale(1) rotate(0deg); } }

        /* ---- text ---- */
        .st-txt {
          text-align: center; opacity: 0; transform: translateY(26px);
          animation: st-txt-rise .85s cubic-bezier(.22,1,.36,1) 1.5s forwards;
        }
        @keyframes st-txt-rise { to { opacity: 1; transform: translateY(0); } }
        .st-hosp-name {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 16px;
          font-size: 12px; font-weight: 700; color: #6E817D;
          letter-spacing: .08em; text-transform: uppercase;
        }
        .st-hosp-name::before, .st-hosp-name::after {
          content: ""; display: block; width: 28px; height: 1px;
          background: rgba(16,42,40,.14);
        }
        .st-txt h1 {
          font-family: "Sora", system-ui, sans-serif;
          font-size: clamp(26px, 4vw, 34px); font-weight: 800;
          letter-spacing: -.03em; line-height: 1.12; color: #0F2A28;
        }
        .st-txt h1 em {
          font-style: normal;
          background: linear-gradient(120deg, #FF8A65 0%, #FF6B7E 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .st-txt p {
          margin-top: 11px; font-size: 14.5px;
          color: #6E817D; font-weight: 500;
        }

        /* ---- pills ---- */
        .st-pills {
          display: flex; flex-wrap: wrap; gap: 10px;
          justify-content: center; max-width: 360px;
          opacity: 0; transform: translateY(16px);
          animation: st-txt-rise .75s cubic-bezier(.22,1,.36,1) 2.1s forwards;
        }
        .st-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 30px;
          font-size: 12.5px; font-weight: 700;
          background: rgba(255,255,255,.75);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.9);
          box-shadow: 0 6px 20px -8px rgba(16,42,40,.18);
          color: #0F2A28;
        }
        .st-pi {
          width: 22px; height: 22px; border-radius: 7px;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .st-pi svg { width: 12px; height: 12px; color: #fff; }
        .st-pi-teal  { background: linear-gradient(120deg, #13B5A4, #0E9F6E); }
        .st-pi-coral { background: linear-gradient(120deg, #FF8A65, #FF6B7E); }

        /* ---- progress bar ---- */
        .st-bar-wrap {
          width: 220px; height: 3px; border-radius: 10px;
          background: rgba(16,42,40,.08); overflow: hidden;
          opacity: 0; animation: st-bar-show .3s ease 1.9s forwards;
        }
        @keyframes st-bar-show { to { opacity: 1; } }
        .st-bar-fill {
          height: 100%; width: 0;
          background: linear-gradient(90deg, #13B5A4, #0E9F6E, #6EE7B7);
          border-radius: 10px;
          animation: st-bar-run 1.5s cubic-bezier(.22,1,.36,1) 2s forwards;
        }
        @keyframes st-bar-run { to { width: 100%; } }
        .st-bar-label {
          margin-top: 9px; font-size: 11px; font-weight: 700;
          color: rgba(16,42,40,.32); letter-spacing: .06em;
          text-transform: uppercase; text-align: center;
          opacity: 0; animation: st-bar-show .3s ease 1.9s forwards;
        }

        /* ---- deco cards ---- */
        .st-deco-card {
          position: absolute;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 18px; padding: 14px 18px;
          box-shadow: 0 14px 36px -18px rgba(16,42,40,.2);
          opacity: 0;
          animation: st-card-in .7s cubic-bezier(.22,1,.36,1) forwards, st-card-bob 5s ease-in-out infinite;
        }
        .st-dc-1 { left: -160px; top: 20px;    animation-delay: 1.9s,  2.6s; }
        .st-dc-2 { right: -150px; bottom: 30px; animation-delay: 2.05s, 2.75s; }
        @keyframes st-card-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes st-card-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .st-dc-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: grid; place-items: center; margin-bottom: 9px;
        }
        .st-dc-icon svg { width: 17px; height: 17px; color: #fff; }
        .st-dc-val {
          font-family: "Sora", system-ui, sans-serif;
          font-size: 20px; font-weight: 700; color: #0F2A28; line-height: 1;
        }
        .st-dc-lbl { font-size: 11px; color: #6E817D; font-weight: 500; margin-top: 3px; max-width: 100px; }

        /* ---- exit fade ---- */
        .st-exit-fade {
          position: fixed; inset: 0; background: #FFFBF7; z-index: 200;
          opacity: 0; pointer-events: none;
          transition: opacity .65s ease;
        }
        .st-exit-fade.go { opacity: 1; pointer-events: all; }

        @media (max-width: 600px) { .st-deco-card { display: none; } }
      `}</style>

      <div className="st-root">
        {/* Orbs + dot grid */}
        <div className="st-bg">
          <div className="st-orb st-orb-a" />
          <div className="st-orb st-orb-b" />
          <div className="st-orb st-orb-c" />
        </div>

        {/* Deco stat cards */}
        <div className="st-deco-card st-dc-1" aria-hidden="true">
          <div className="st-dc-icon" style={{ background: 'linear-gradient(120deg,#FF8A65,#FF6B7E)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={3} />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22" />
            </svg>
          </div>
          <div className="st-dc-val">8</div>
          <div className="st-dc-lbl">AI Agents Running</div>
        </div>

        <div className="st-deco-card st-dc-2" aria-hidden="true">
          <div className="st-dc-icon" style={{ background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2a9 9 0 110 18A9 9 0 0112 2zM12 7v5l3 3" />
            </svg>
          </div>
          <div className="st-dc-val">&lt;1 min</div>
          <div className="st-dc-lbl">Response Time</div>
        </div>

        {/* Stage */}
        <div className="st-stage">

          {/* Ring + logo */}
          <div className="st-ring-wrap">
            <div className="st-ring-glow" />
            <div className="st-rpl st-rpl-1" />
            <div className="st-rpl st-rpl-2" />
            <div className="st-rpl st-rpl-3" />

            {/* Outer slow-spinning coral arc */}
            <svg className="st-ring-outer" viewBox="0 0 190 190" aria-hidden="true">
              <defs>
                <linearGradient id="st-rg-coral" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD0BB" />
                  <stop offset="100%" stopColor="#FF8A65" />
                </linearGradient>
                <linearGradient id="st-rg-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#13B5A4" />
                </linearGradient>
              </defs>
              <circle className="st-r-outer-track" cx={95} cy={95} r={82} />
              <circle className="st-r-outer-arc"   cx={95} cy={95} r={82} />
            </svg>

            {/* Inner fast-spinning teal arc (reverse) */}
            <svg className="st-ring-inner" viewBox="0 0 152 152" aria-hidden="true">
              <circle className="st-r-inner-arc" cx={76} cy={76} r={64} />
            </svg>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} className="st-logo" alt="Navajeevana Ortho Hospitals logo" />

            {/* Coral AI badge */}
            <div className="st-ai-badge" aria-hidden="true">🤖</div>
          </div>

          {/* Text */}
          <div className="st-txt">
            <div className="st-hosp-name">Navajeevana Ortho Hospitals</div>
            <h1>Query Handing Over to<br /><em>Artho AI</em></h1>
            <p>Connecting to our 8-agent AI pipeline…</p>
          </div>

          {/* Pills */}
          <div className="st-pills">
            <span className="st-pill">
              <span className="st-pi st-pi-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx={12} cy={12} r={3} />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2" />
                </svg>
              </span>
              8 AI Agents
            </span>
            <span className="st-pill">
              <span className="st-pi st-pi-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              Live Pipeline
            </span>
            <span className="st-pill">
              <span className="st-pi st-pi-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 3l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V7z" />
                </svg>
              </span>
              Secure Analysis
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="st-bar-wrap"><div className="st-bar-fill" /></div>
            <div className="st-bar-label">Initializing Artho AI…</div>
          </div>

        </div>

        {/* Exit fade overlay */}
        <div className={`st-exit-fade${exiting ? ' go' : ''}`} />
      </div>
    </>
  )
}
