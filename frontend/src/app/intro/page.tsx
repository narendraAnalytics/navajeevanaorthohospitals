'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const LOGO = 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png'
const VIDEO = 'https://res.cloudinary.com/dkqbzwicr/video/upload/q_auto/f_auto/v1780937062/Create_an_second_ultra_reali_cdxura.webm'

export default function IntroPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fillRef  = useRef<HTMLDivElement>(null)
  const timerRef = useRef<HTMLSpanElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const [exiting, setExiting] = useState(false)
  const calledRef = useRef(false)
  const router = useRouter()

  function enterSite() {
    if (calledRef.current) return
    calledRef.current = true
    setExiting(true)
    setTimeout(() => { router.push('/?entered=1') }, 680)
  }

  useEffect(() => {
    const video = videoRef.current
    const fill  = fillRef.current
    const timer = timerRef.current

    if (video) {
      const onCanPlay = () => video.classList.add('ready')
      const onTimeUpdate = () => {
        if (!video.duration) return
        const pct = (video.currentTime / video.duration) * 100
        if (fill) fill.style.width = pct + '%'
        const rem = Math.ceil(video.duration - video.currentTime)
        if (timer) timer.textContent = rem + 's'
      }
      const onEnded = () => enterSite()
      video.addEventListener('canplay', onCanPlay)
      video.addEventListener('timeupdate', onTimeUpdate)
      video.addEventListener('ended', onEnded)
      const autoId = setTimeout(enterSite, 16000)
      return () => {
        video.removeEventListener('canplay', onCanPlay)
        video.removeEventListener('timeupdate', onTimeUpdate)
        video.removeEventListener('ended', onEnded)
        clearTimeout(autoId)
      }
    }
  }, [])

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      const sz    = Math.random() * 2.5 + 1
      const left  = Math.random() * 100
      const dur   = Math.random() * 14 + 9
      const delay = Math.random() * 10
      const col   = Math.random() > 0.4
        ? `rgba(17,181,164,${(Math.random() * 0.4 + 0.2).toFixed(2)})`
        : `rgba(110,231,183,${(Math.random() * 0.3 + 0.15).toFixed(2)})`
      p.style.cssText = `width:${sz}px;height:${sz}px;left:${left}%;bottom:-10px;background:${col};animation-duration:${dur}s;animation-delay:${delay}s;`
      container.appendChild(p)
    }
  }, [])

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #05101E; }

        .stage { position: fixed; inset: 0; background: #05101E; }
        .stage.exiting { animation: pageOut .7s ease forwards; }
        @keyframes pageOut { 0% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(1.04); } }

        .bg-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 0; transition: opacity 2s ease; }
        .bg-video.ready { opacity: 1; }

        .vig { position: absolute; inset: 0; pointer-events: none; }
        .vig-radial { z-index: 2; background: radial-gradient(ellipse 72% 68% at 50% 50%, transparent 28%, rgba(5,16,30,.55) 56%, rgba(5,16,30,.92) 74%, #05101E 88%); }
        .vig-tb { z-index: 2; background: linear-gradient(to bottom,#05101E 0%,transparent 18%), linear-gradient(to top,#05101E 0%,transparent 22%); }
        .vig-lr { z-index: 2; background: linear-gradient(to right,#05101E 0%,transparent 12%), linear-gradient(to left,#05101E 0%,transparent 12%); }

        .grain { position: absolute; inset: 0; z-index: 3; pointer-events: none; opacity: .04;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E");
          background-size: 220px 220px; animation: grainShift .08s steps(1) infinite; }
        @keyframes grainShift { 0%{background-position:0 0} 25%{background-position:-40px 20px} 50%{background-position:30px -15px} 75%{background-position:-20px -30px} 100%{background-position:10px 40px} }

        .center-glow { position: absolute; inset: 0; z-index: 2; pointer-events: none; background: radial-gradient(ellipse 60% 50% at 50% 52%, rgba(17,181,164,.1) 0%, transparent 65%); }

        .scanlines { position: absolute; inset: 0; z-index: 4; pointer-events: none;
          background: repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px); opacity: .5; }

        .particles { position: absolute; inset: 0; z-index: 4; pointer-events: none; overflow: hidden; }
        .particle { position: absolute; border-radius: 50%; background: rgba(17,181,164,.5); animation: rise linear infinite; }
        @keyframes rise { 0%{transform:translateY(0) scale(0);opacity:0} 5%{opacity:1} 90%{opacity:.4} 100%{transform:translateY(-110vh) scale(.5);opacity:0} }

        .content { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px 140px; text-align: center; font-family: "Sora", system-ui, sans-serif; }

        .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; opacity: 0; transform: translateY(18px); animation: up .8s ease forwards .7s; }
        .logo-img { width: 46px; height: 46px; border-radius: 50%; border: 1.5px solid rgba(17,181,164,.35); box-shadow: 0 0 20px rgba(17,181,164,.25); }
        .logo-tag { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.35); letter-spacing: .22em; text-transform: uppercase; }

        .eyebrow { font-size: 11px; font-weight: 600; color: #11B5A4; letter-spacing: .26em; text-transform: uppercase; margin-bottom: 14px; opacity: 0; transform: translateY(18px); animation: up .8s ease forwards 1s; }

        .main-title { font-family: "Sora", system-ui, sans-serif; font-size: clamp(52px,9vw,110px); font-weight: 900; color: #fff; line-height: .92; letter-spacing: -.025em; margin-bottom: 8px; opacity: 0; transform: translateY(24px); animation: up .9s cubic-bezier(.22,1,.36,1) forwards 1.2s; }
        .main-title span { background: linear-gradient(100deg,#fff 40%,rgba(17,181,164,.9) 60%,#fff 80%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite 2.5s; }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .sub-title { font-family: "Sora", system-ui, sans-serif; font-size: clamp(14px,2.2vw,24px); font-weight: 300; color: rgba(255,255,255,.45); letter-spacing: .22em; text-transform: uppercase; margin-bottom: 30px; opacity: 0; transform: translateY(18px); animation: up .8s ease forwards 1.45s; }

        .accent-rule { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; opacity: 0; animation: fadeIn .8s ease forwards 1.7s; }
        .rule-line { height: 1px; width: 90px; background: linear-gradient(to right,transparent,rgba(17,181,164,.55)); }
        .rule-line.r { background: linear-gradient(to left,transparent,rgba(17,181,164,.55)); }
        .rule-dot { width: 5px; height: 5px; border-radius: 50%; background: #11B5A4; box-shadow: 0 0 10px rgba(17,181,164,1),0 0 24px rgba(17,181,164,.5); }

        .tagline { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 14px; font-weight: 500; color: rgba(255,255,255,.35); letter-spacing: .08em; opacity: 0; transform: translateY(14px); animation: up .8s ease forwards 1.9s; }

        .bottom-hud { position: absolute; bottom: 0; left: 0; right: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; padding-bottom: 44px; gap: 20px; opacity: 0; animation: fadeIn .9s ease forwards 2.4s; }

        .timer-wrap { display: flex; align-items: center; gap: 14px; }
        .timer-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.25); letter-spacing: .1em; text-transform: uppercase; }
        .progress-track { width: min(360px,60vw); height: 1.5px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; width: 0%; background: linear-gradient(to right,#11B5A4,#6EE7B7); border-radius: 2px; box-shadow: 0 0 8px rgba(17,181,164,.7); transition: width .4s linear; }

        .btn-row { display: flex; align-items: center; gap: 16px; }
        .btn-enter { display: flex; align-items: center; gap: 9px; padding: 13px 34px; border-radius: 50px; background: linear-gradient(135deg,#13B5A4,#0B9B78); color: #fff; font-family: "Sora", system-ui, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: .03em; border: none; cursor: pointer; box-shadow: 0 8px 32px -6px rgba(17,181,164,.55); transition: transform .2s,box-shadow .2s; animation: btnPulse 2.5s ease infinite 3.5s; }
        .btn-enter:hover { transform: scale(1.05); box-shadow: 0 12px 44px -4px rgba(17,181,164,.75); }
        .btn-enter svg { width: 15px; height: 15px; }
        @keyframes btnPulse { 0%,100%{box-shadow:0 8px 32px -6px rgba(17,181,164,.55)} 50%{box-shadow:0 8px 52px -2px rgba(17,181,164,.9)} }

        .btn-skip { background: none; border: none; color: rgba(255,255,255,.22); font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; padding: 8px 12px; transition: color .2s; }
        .btn-skip:hover { color: rgba(255,255,255,.5); }

        .corner-badge { position: absolute; z-index: 10; font-family: "Sora", system-ui, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,.18); opacity: 0; animation: fadeIn .8s ease forwards 2.8s; line-height: 1.6; }
        .cb-tl { top: 24px; left: 28px; }
        .cb-tr { top: 24px; right: 28px; text-align: right; }
        .corner-badge::before { display: block; color: rgba(17,181,164,.4); font-size: 16px; line-height: 1; margin-bottom: 4px; }
        .cb-tl::before { content: "┌"; }
        .cb-tr::before { content: "┐"; }

        @keyframes up { to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>

      <div className={`stage${exiting ? ' exiting' : ''}`}>

        {/* Video */}
        <video ref={videoRef} className="bg-video" autoPlay muted playsInline>
          <source src={VIDEO} type="video/webm" />
        </video>

        {/* Vignette */}
        <div className="vig vig-radial" />
        <div className="vig vig-tb" />
        <div className="vig vig-lr" />

        {/* Grain + scanlines */}
        <div className="grain" />
        <div className="scanlines" />

        {/* Center glow */}
        <div className="center-glow" />

        {/* Particles */}
        <div className="particles" ref={particlesRef} />

        {/* Corner badges */}
        <div className="corner-badge cb-tl">
          Vijayawada · Bhimavaram<br />Eluru · Palakollu
        </div>
        <div className="corner-badge cb-tr">
          Est. 2008<br />Advanced Orthopedics
        </div>

        {/* Main content */}
        <div className="content">
          <div className="logo-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Logo" className="logo-img" />
            <span className="logo-tag">Est. 2008</span>
          </div>
          <div className="eyebrow">Advanced Orthopedic Care</div>
          <h1 className="main-title"><span>NAVAJEEVANA</span></h1>
          <div className="sub-title">Ortho Hospitals</div>
          <div className="accent-rule">
            <div className="rule-line" />
            <div className="rule-dot" />
            <div className="rule-line r" />
          </div>
          <p className="tagline">Healing Mobility &nbsp;·&nbsp; Restoring Lives</p>
        </div>

        {/* Bottom HUD */}
        <div className="bottom-hud">
          <div className="timer-wrap">
            <span className="timer-label">Loading</span>
            <div className="progress-track">
              <div className="progress-fill" ref={fillRef} />
            </div>
            <span className="timer-label" ref={timerRef}>—</span>
          </div>
          <div className="btn-row">
            <button className="btn-enter" onClick={enterSite}>
              Enter Site
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button className="btn-skip" onClick={enterSite}>Skip Intro</button>
          </div>
        </div>

      </div>
    </>
  )
}
