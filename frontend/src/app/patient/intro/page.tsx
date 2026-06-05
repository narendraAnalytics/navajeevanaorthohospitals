'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOGO = 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png'

export default function PatientIntro() {
  const router = useRouter()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 3500)
    const t2 = setTimeout(() => router.push('/patient'), 4150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [router])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .intro-root {
          position: fixed; inset: 0;
          background: #FFFBF7;
          display: flex; align-items: center; justify-content: center;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        /* ---- orbs ---- */
        .intro-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .intro-bg::after {
          content: "";
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(16,42,40,.055) 1px, transparent 1px);
          background-size: 38px 38px;
        }
        .intro-orb {
          position: absolute; border-radius: 50%;
          filter: blur(70px); opacity: .55;
          animation: orb-float 14s ease-in-out infinite;
        }
        .intro-orb-a { width: 500px; height: 500px; top: -140px; left: -160px; background: radial-gradient(circle, #9DF0D6, transparent 70%); }
        .intro-orb-b { width: 440px; height: 440px; right: -130px; top: 200px; background: radial-gradient(circle, #FFD0BB, transparent 70%); animation-delay: -4s; }
        .intro-orb-c { width: 380px; height: 380px; left: 38%; bottom: -160px; background: radial-gradient(circle, #FFC7E0, transparent 70%); animation-delay: -8s; }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(24px, -22px); }
        }

        /* ---- stage ---- */
        .intro-stage {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          align-items: center; gap: 36px;
        }

        /* ---- ring ---- */
        .ring-wrap {
          position: relative; width: 190px; height: 190px;
          display: flex; align-items: center; justify-content: center;
        }
        .ring-glow {
          position: absolute; width: 160px; height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(17,181,164,.22) 0%, transparent 70%);
          animation: glow-pulse 2.8s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { transform: scale(1); opacity: .55; }
          50%       { transform: scale(1.16); opacity: 1; }
        }
        .rpl {
          position: absolute; border-radius: 50%;
          border: 1.5px solid rgba(17,181,164,.18);
          animation: rpl-anim 3.2s ease-out infinite;
        }
        .rpl-1 { width: 210px; height: 210px; animation-delay: 0s; }
        .rpl-2 { width: 260px; height: 260px; animation-delay: 1.1s; }
        .rpl-3 { width: 310px; height: 310px; animation-delay: 2.2s; }
        @keyframes rpl-anim {
          0%   { transform: scale(.68); opacity: .6; }
          100% { transform: scale(1);   opacity: 0; }
        }
        .ring-svg {
          position: absolute; width: 190px; height: 190px;
          transform: rotate(-90deg);
        }
        .ring-track { fill: none; stroke: rgba(17,181,164,.12); stroke-width: 3; }
        .ring-fill {
          fill: none; stroke: url(#rg); stroke-width: 4.5;
          stroke-linecap: round;
          stroke-dasharray: 515; stroke-dashoffset: 515;
          animation: ring-draw 1.6s cubic-bezier(.65,0,.35,1) .35s forwards;
        }
        @keyframes ring-draw { to { stroke-dashoffset: 0; } }

        .logo-img {
          position: relative; z-index: 2;
          width: 100px; height: 100px; border-radius: 50%;
          opacity: 0; transform: scale(.55);
          box-shadow: 0 16px 44px rgba(16,42,40,.18), 0 0 0 5px rgba(17,181,164,.15), 0 0 0 10px rgba(17,181,164,.06);
          animation: logo-in .75s cubic-bezier(.34,1.56,.64,1) .1s forwards;
        }
        @keyframes logo-in { to { opacity: 1; transform: scale(1); } }

        .check-badge {
          position: absolute; bottom: 6px; right: 6px; z-index: 3;
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #13B5A4 0%, #0DB56C 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 24px rgba(16,185,129,.45), 0 0 0 4px #FFFBF7, 0 0 0 6px rgba(16,185,129,.18);
          opacity: 0; transform: scale(0) rotate(-70deg);
          animation: badge-in .55s cubic-bezier(.34,1.56,.64,1) 1.95s forwards;
        }
        @keyframes badge-in { to { opacity: 1; transform: scale(1) rotate(0deg); } }
        .check-path {
          stroke-dasharray: 22; stroke-dashoffset: 22;
          animation: check-draw .4s ease 2.4s forwards;
        }
        @keyframes check-draw { to { stroke-dashoffset: 0; } }

        /* ---- text ---- */
        .intro-txt {
          text-align: center; opacity: 0; transform: translateY(26px);
          animation: txt-rise .85s cubic-bezier(.22,1,.36,1) 1.65s forwards;
        }
        @keyframes txt-rise { to { opacity: 1; transform: translateY(0); } }
        .hospital-name {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 16px;
          font-size: 12px; font-weight: 700; color: #6E817D;
          letter-spacing: .08em; text-transform: uppercase;
        }
        .hospital-name::before, .hospital-name::after {
          content: ""; display: block; width: 28px; height: 1px;
          background: rgba(16,42,40,.14);
        }
        .intro-txt h1 {
          font-family: "Sora", system-ui, sans-serif;
          font-size: clamp(28px, 4vw, 36px); font-weight: 800;
          letter-spacing: -.03em; line-height: 1.1; color: #0F2A28;
        }
        .intro-txt h1 em {
          font-style: normal;
          background: linear-gradient(120deg, #13B5A4 0%, #0E9F6E 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .intro-txt p {
          margin-top: 11px; font-size: 14.5px;
          color: #6E817D; font-weight: 500;
        }

        /* ---- pills ---- */
        .intro-pills {
          display: flex; flex-wrap: wrap; gap: 10px;
          justify-content: center; max-width: 360px;
          opacity: 0; transform: translateY(16px);
          animation: txt-rise .75s cubic-bezier(.22,1,.36,1) 2.3s forwards;
        }
        .intro-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 30px;
          font-size: 12.5px; font-weight: 700;
          background: rgba(255,255,255,.75);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,.9);
          box-shadow: 0 6px 20px -8px rgba(16,42,40,.18);
          color: #0F2A28;
        }
        .pi {
          width: 22px; height: 22px; border-radius: 7px;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .pi svg { width: 12px; height: 12px; color: #fff; }
        .pi-teal   { background: linear-gradient(120deg, #13B5A4, #0E9F6E); }
        .pi-coral  { background: linear-gradient(120deg, #FF8A65, #FF6B7E); }
        .pi-violet { background: linear-gradient(120deg, #A78BFA, #7C8BFF); }

        /* ---- progress bar ---- */
        .bar-wrap {
          width: 220px; height: 3px; border-radius: 10px;
          background: rgba(16,42,40,.08); overflow: hidden;
          opacity: 0; animation: bar-show .3s ease 2.1s forwards;
        }
        @keyframes bar-show { to { opacity: 1; } }
        .bar-fill {
          height: 100%; width: 0;
          background: linear-gradient(90deg, #13B5A4, #6EE7B7, #5FD3E6);
          border-radius: 10px;
          animation: bar-run 1.4s cubic-bezier(.22,1,.36,1) 2.2s forwards;
        }
        @keyframes bar-run { to { width: 100%; } }
        .bar-label {
          margin-top: 9px; font-size: 11px; font-weight: 700;
          color: rgba(16,42,40,.32); letter-spacing: .06em;
          text-transform: uppercase; text-align: center;
          opacity: 0; animation: bar-show .3s ease 2.1s forwards;
        }

        /* ---- deco cards ---- */
        .deco-card {
          position: absolute;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,.85);
          border-radius: 18px; padding: 14px 18px;
          box-shadow: 0 14px 36px -18px rgba(16,42,40,.2);
          opacity: 0;
          animation: card-float-in .7s cubic-bezier(.22,1,.36,1) forwards, card-bob 5s ease-in-out infinite;
        }
        .dc-1 { left: -160px; top: 20px; animation-delay: 2s, 2.7s; }
        .dc-2 { right: -150px; bottom: 30px; animation-delay: 2.15s, 2.85s; }
        @keyframes card-float-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes card-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .dc-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: grid; place-items: center; margin-bottom: 9px;
        }
        .dc-icon svg { width: 17px; height: 17px; color: #fff; }
        .dc-val {
          font-family: "Sora", system-ui, sans-serif;
          font-size: 20px; font-weight: 700; color: #0F2A28; line-height: 1;
        }
        .dc-lbl { font-size: 11px; color: #6E817D; font-weight: 500; margin-top: 3px; max-width: 100px; }

        /* ---- exit fade ---- */
        .exit-fade {
          position: fixed; inset: 0; background: #FFFBF7; z-index: 200;
          opacity: 0; pointer-events: none;
          transition: opacity .65s ease;
        }
        .exit-fade.go { opacity: 1; pointer-events: all; }

        @media (max-width: 600px) { .deco-card { display: none; } }
      `}</style>

      <div className="intro-root">
        {/* Orbs */}
        <div className="intro-bg">
          <div className="intro-orb intro-orb-a" />
          <div className="intro-orb intro-orb-b" />
          <div className="intro-orb intro-orb-c" />
        </div>

        {/* Deco cards */}
        <div className="deco-card dc-1" aria-hidden="true">
          <div className="dc-icon" style={{ background: 'linear-gradient(120deg,#13B5A4,#0E9F6E)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={9} cy={8} r={3} /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M17 8h4m-2-2v4" />
            </svg>
          </div>
          <div className="dc-val">8+</div>
          <div className="dc-lbl">Specialist Doctors</div>
        </div>
        <div className="deco-card dc-2" aria-hidden="true">
          <div className="dc-icon" style={{ background: 'linear-gradient(120deg,#FF8A65,#FF6B7E)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 8.9l6.9-.6z" />
            </svg>
          </div>
          <div className="dc-val">4.9★</div>
          <div className="dc-lbl">Patient Rating</div>
        </div>

        {/* Stage */}
        <div className="intro-stage">
          {/* Ring + logo */}
          <div className="ring-wrap">
            <div className="ring-glow" />
            <div className="rpl rpl-1" />
            <div className="rpl rpl-2" />
            <div className="rpl rpl-3" />

            <svg className="ring-svg" viewBox="0 0 190 190" aria-hidden="true">
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="50%" stopColor="#13B5A4" />
                  <stop offset="100%" stopColor="#0E9F6E" />
                </linearGradient>
              </defs>
              <circle className="ring-track" cx={95} cy={95} r={82} />
              <circle className="ring-fill"  cx={95} cy={95} r={82} />
            </svg>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} className="logo-img" alt="Navajeevana Ortho Hospitals logo" />

            <div className="check-badge" aria-hidden="true">
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path className="check-path" d="M5 12l5 5L20 7" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="intro-txt">
            <div className="hospital-name">Navajeevana Ortho Hospitals</div>
            <h1>Welcome to the<br /><em>Patient Portal</em></h1>
            <p>Our care team responds to every query within 24 hours</p>
          </div>

          {/* Pills */}
          <div className="intro-pills">
            <span className="intro-pill">
              <span className="pi pi-teal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Submit Query
            </span>
            <span className="intro-pill">
              <span className="pi pi-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" />
                </svg>
              </span>
              Track Ticket
            </span>
            <span className="intro-pill">
              <span className="pi pi-violet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2a9 9 0 110 18A9 9 0 0112 2zM12 7v5l3 3" />
                </svg>
              </span>
              24 / 7 Support
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="bar-wrap"><div className="bar-fill" /></div>
            <div className="bar-label">Loading your portal…</div>
          </div>
        </div>

        {/* Exit fade overlay */}
        <div className={`exit-fade${exiting ? ' go' : ''}`} />
      </div>
    </>
  )
}
