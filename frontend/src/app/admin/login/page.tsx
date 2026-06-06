'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [btnState, setBtnState] = useState<'idle' | 'loading' | 'success'>('idle')
  const pwdRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === '1') {
      router.replace('/admin')
    }
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password) {
      setError('Please enter your password.')
      pwdRef.current?.focus()
      return
    }
    setBtnState('loading')
    setTimeout(() => {
      if (password === 'admin@123') {
        setBtnState('success')
        sessionStorage.setItem('adminAuth', '1')
        setTimeout(() => router.push('/admin'), 900)
      } else {
        setBtnState('idle')
        setError('Incorrect password. Please try again.')
        setPassword('')
        pwdRef.current?.focus()
      }
    }, 1300)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; width: 100%; -webkit-font-smoothing: antialiased; overflow: hidden; }

        .adm-shell {
          height: 100vh; width: 100vw;
          display: flex; align-items: center; justify-content: center;
          padding: 28px;
          background: #E6EFF5;
          background-image:
            radial-gradient(ellipse at 20% 30%, rgba(17,181,164,.13) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, rgba(13,148,136,.10) 0%, transparent 55%);
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
        }

        .adm-split {
          display: grid;
          grid-template-columns: 46% 1fr;
          width: 100%; max-width: 1080px;
          height: 100%; max-height: 680px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 32px 80px -24px rgba(16,42,40,.28),
            0 0 0 1px rgba(255,255,255,.55);
        }

        /* LEFT */
        .adm-left {
          position: relative; overflow: hidden;
          background: #061428;
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 44px 48px 40px;
        }
        .adm-left-bg {
          position: absolute; inset: 0;
          background: url('/assets/hospital-building.png') center center / cover no-repeat;
          opacity: .28; z-index: 0;
        }
        .adm-left-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(180deg,
              rgba(6,20,40,.92) 0%, rgba(6,20,40,.55) 40%,
              rgba(6,20,40,.72) 70%, rgba(6,20,40,.97) 100%);
          z-index: 1;
        }
        .adm-ring-glow {
          position: absolute; bottom: -100px; left: -80px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(17,181,164,.18) 0%, transparent 68%);
          z-index: 2; pointer-events: none;
          animation: adm-glow 5s ease-in-out infinite;
        }
        @keyframes adm-glow {
          0%, 100% { opacity: .7; transform: scale(1); }
          50%       { opacity: 1;  transform: scale(1.06); }
        }
        .adm-deco-hex {
          position: absolute; top: 0; right: 0;
          width: 260px; height: 260px;
          opacity: .12; z-index: 2; pointer-events: none;
        }
        .adm-deco-cross {
          position: absolute; top: 48px; right: 120px;
          width: 28px; height: 28px;
          opacity: .22; z-index: 2; pointer-events: none;
        }
        .adm-deco-cross2 {
          position: absolute; bottom: 140px; left: 44px;
          width: 20px; height: 20px;
          opacity: .15; z-index: 2; pointer-events: none;
        }
        .adm-ltop, .adm-lmid, .adm-lbot { position: relative; z-index: 3; }

        .adm-logo { display: flex; align-items: center; gap: 14px; }
        .adm-logo img {
          width: 52px; height: 52px; border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(17,181,164,.35), 0 0 24px rgba(17,181,164,.2);
        }
        .adm-logo-txt { line-height: 1.18; }
        .adm-logo-txt strong {
          display: block;
          font-family: "Sora", system-ui, sans-serif;
          font-size: 15px; font-weight: 800;
          color: #fff; letter-spacing: .01em;
        }
        .adm-logo-txt strong em { font-style: normal; color: #11B5A4; }
        .adm-logo-txt span {
          display: flex; align-items: center; gap: 7px;
          font-size: 9.5px; font-weight: 700; letter-spacing: .12em;
          color: rgba(255,255,255,.45); text-transform: uppercase; margin-top: 2px;
        }
        .adm-logo-txt span::before,
        .adm-logo-txt span::after {
          content: ""; display: block;
          width: 18px; height: 1px; background: rgba(255,255,255,.22);
        }
        .adm-tagline { font-size: 12px; color: rgba(255,255,255,.38); font-weight: 500; margin-top: 5px; }

        .adm-lmid { padding: 0 0 28px; }
        .adm-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(17,181,164,.14); border: 1px solid rgba(17,181,164,.28);
          border-radius: 30px; padding: 5px 14px; margin-bottom: 18px;
          font-size: 11px; font-weight: 700; color: #5FE8D8;
          letter-spacing: .06em; text-transform: uppercase;
        }
        .adm-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #13B5A4;
          animation: adm-dot 1.4s ease-in-out infinite;
        }
        @keyframes adm-dot {
          0%, 100% { opacity: .4; transform: scale(.7); }
          50%       { opacity: 1;  transform: scale(1.3); }
        }
        .adm-lmid h2 {
          font-family: "Sora", system-ui, sans-serif;
          font-size: clamp(22px, 2.8vw, 32px);
          font-weight: 800; color: #fff;
          line-height: 1.18; letter-spacing: -.02em; margin-bottom: 10px;
        }
        .adm-lmid h2 em { font-style: normal; color: #11B5A4; }
        .adm-lmid p { font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.7; max-width: 280px; }

        .adm-features { display: grid; grid-template-columns: 1fr 1fr 1fr; }
        .adm-feat {
          display: flex; flex-direction: column; align-items: center;
          gap: 9px; padding: 18px 12px 14px;
          border-top: 1px solid rgba(255,255,255,.08);
          text-align: center;
        }
        .adm-feat:not(:last-child) { border-right: 1px solid rgba(255,255,255,.08); }
        .adm-feat-icon {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
        }
        .adm-feat-icon svg { width: 18px; height: 18px; color: #11B5A4; }
        .adm-feat strong { font-size: 12px; font-weight: 700; color: rgba(255,255,255,.85); line-height: 1.2; }
        .adm-feat span { font-size: 10.5px; color: rgba(255,255,255,.35); line-height: 1.45; }

        /* RIGHT */
        .adm-right {
          background: #F8FAFB;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 64px 32px 24px;
          position: relative; overflow-y: auto;
        }
        .adm-right::-webkit-scrollbar { width: 4px; }
        .adm-right::-webkit-scrollbar-track { background: transparent; }
        .adm-right::-webkit-scrollbar-thumb { background: rgba(13,148,136,.2); border-radius: 4px; }

        .adm-card {
          background: #fff; border-radius: 28px;
          width: 100%; max-width: 430px;
          padding: 36px 40px 28px;
          margin: 0 auto;
          box-shadow:
            0 4px 6px -2px rgba(16,42,40,.04),
            0 20px 60px -20px rgba(16,42,40,.14);
          animation: adm-card-in .55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes adm-card-in {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .adm-shield {
          width: 68px; height: 68px;
          background: linear-gradient(145deg, #E8F8F6 0%, #D0F4EF 100%);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 8px 24px rgba(17,181,164,.15);
        }
        .adm-shield svg { width: 30px; height: 30px; color: #0D9488; }

        .adm-card h1 {
          font-family: "Sora", system-ui, sans-serif;
          font-size: 26px; font-weight: 800;
          letter-spacing: -.025em; color: #0A1628;
          text-align: center; margin-bottom: 7px;
        }
        .adm-sub {
          font-size: 13.5px; color: #7E93A7;
          text-align: center; line-height: 1.6; margin-bottom: 20px;
        }

        .adm-field { margin-bottom: 14px; }
        .adm-label {
          display: block; font-size: 13px; font-weight: 700;
          color: #1A2E3B; margin-bottom: 8px; letter-spacing: -.01em;
        }
        .adm-input-wrap { position: relative; display: flex; align-items: center; }
        .adm-input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: #A0B4C0; pointer-events: none; display: flex; align-items: center;
        }
        .adm-input-icon svg { width: 16px; height: 16px; }
        .adm-input-lock {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          color: #C5D4DF; pointer-events: none; display: flex; align-items: center;
        }
        .adm-input-lock svg { width: 15px; height: 15px; }
        .adm-input {
          width: 100%; padding: 14px 44px;
          border: 1.5px solid #E2EAF0; border-radius: 14px;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 13.5px; font-weight: 600; color: #1A2E3B;
          background: #F8FAFB; outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
          letter-spacing: .02em;
        }
        .adm-input:focus {
          border-color: #13B5A4; background: #fff;
          box-shadow: 0 0 0 4px rgba(17,181,164,.12);
        }
        .adm-input[readonly] { color: #4A6070; cursor: default; }
        .adm-input[readonly]:focus { border-color: #E2EAF0; box-shadow: none; background: #F8FAFB; }

        .adm-pwd-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #A0B4C0; padding: 4px; display: flex; align-items: center;
          transition: color .2s; border-radius: 6px;
        }
        .adm-pwd-toggle:hover { color: #13B5A4; }
        .adm-pwd-toggle svg { width: 17px; height: 17px; }

        .adm-row-extras {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; margin-top: 4px;
        }
        .adm-check-wrap {
          display: flex; align-items: center; gap: 9px;
          cursor: pointer; user-select: none;
        }
        .adm-check-box {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid #D0DCE5; background: #F8FAFB;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background .2s, border-color .2s;
        }
        .adm-check-box.checked { background: #13B5A4; border-color: #13B5A4; }
        .adm-check-box svg { width: 11px; height: 11px; }
        .adm-check-label { font-size: 13px; font-weight: 600; color: #4A6070; }
        .adm-forgot { font-size: 13px; font-weight: 700; color: #0D9488; text-decoration: none; transition: color .2s; }
        .adm-forgot:hover { color: #0B7A6E; }

        .adm-error {
          display: none;
          background: rgba(239,68,68,.06);
          border: 1px solid rgba(239,68,68,.2);
          border-radius: 12px; padding: 11px 14px;
          font-size: 13px; font-weight: 600; color: #B91C1C;
          margin-bottom: 18px;
          align-items: center; gap: 9px;
        }
        .adm-error.show { display: flex; }
        .adm-error svg { width: 16px; height: 16px; flex-shrink: 0; }

        .adm-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(120deg, #13B5A4 0%, #0D9488 60%, #0B7A6E 100%);
          color: #fff; border: none; border-radius: 14px;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 15px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          box-shadow: 0 10px 28px -10px rgba(13,148,136,.55);
          transition: transform .2s, opacity .2s, box-shadow .2s;
          letter-spacing: .01em;
        }
        .adm-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 34px -10px rgba(13,148,136,.65); }
        .adm-btn:active { transform: translateY(0); }
        .adm-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }
        .adm-btn svg { width: 17px; height: 17px; }
        .adm-btn.success { background: linear-gradient(120deg, #10B981, #0D9488); }

        @keyframes adm-spin { to { transform: rotate(360deg); } }
        .adm-spin { animation: adm-spin .7s linear infinite; }

        .adm-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0 12px;
        }
        .adm-divider::before, .adm-divider::after { content: ""; flex: 1; height: 1px; background: #E9EFF4; }
        .adm-divider span { font-size: 11.5px; font-weight: 600; color: #A0B4C0; white-space: nowrap; letter-spacing: .04em; }

        .adm-sec-note { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
        .adm-sec-note-icon {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #E8F8F6, #D0F4EF);
          display: flex; align-items: center; justify-content: center;
        }
        .adm-sec-note-icon svg { width: 15px; height: 15px; color: #0D9488; }
        .adm-sec-note p { font-size: 11.5px; color: #A0B4C0; font-weight: 500; line-height: 1.5; }

        .adm-back {
          position: absolute; top: 22px; left: 26px;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600; color: #7E93A7;
          text-decoration: none; padding: 8px 12px; border-radius: 30px;
          transition: background .2s, color .2s;
        }
        .adm-back:hover { background: rgba(13,148,136,.08); color: #0D9488; }
        .adm-back svg { width: 14px; height: 14px; }

        @media (max-width: 860px) {
          .adm-split { grid-template-columns: 1fr; }
          .adm-left { display: none; }
          .adm-right { background: linear-gradient(145deg, #E8F8F6, #F4F7FA); }
        }
        @media (max-width: 480px) {
          .adm-card { padding: 32px 22px 28px; border-radius: 20px; }
        }
      `}</style>

      <div className="adm-shell">
        <div className="adm-split">

          {/* LEFT PANEL */}
          <div className="adm-left">
            <div className="adm-left-bg" />
            <div className="adm-left-overlay" />
            <div className="adm-ring-glow" />

            <svg className="adm-deco-hex" viewBox="0 0 260 260" fill="none" aria-hidden="true">
              <path d="M200 20 L220 32 L220 56 L200 68 L180 56 L180 32 Z" stroke="white" strokeWidth="1"/>
              <path d="M240 60 L255 70 L255 90 L240 100 L225 90 L225 70 Z" stroke="white" strokeWidth="1"/>
              <path d="M160 10 L175 20 L175 40 L160 50 L145 40 L145 20 Z" stroke="white" strokeWidth="1"/>
              <path d="M220 100 L240 112 L240 136 L220 148 L200 136 L200 112 Z" stroke="white" strokeWidth="1"/>
              <path d="M170 70 L185 80 L185 100 L170 110 L155 100 L155 80 Z" stroke="white" strokeWidth="1"/>
            </svg>
            <svg className="adm-deco-cross" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M14 2 L14 26 M2 14 L26 14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <svg className="adm-deco-cross2" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 1 L10 19 M1 10 L19 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>

            <div className="adm-ltop">
              <div className="adm-logo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.png" alt="Navajeevana logo" />
                <div className="adm-logo-txt">
                  <strong>NAVAJEEVANA<em>ORTHO</em></strong>
                  <span>Hospital</span>
                </div>
              </div>
              <div className="adm-tagline">Advanced Care for Bones &amp; Joints</div>
            </div>

            <div className="adm-lmid">
              <div className="adm-badge"><div className="adm-badge-dot" />Secure Admin Portal</div>
              <h2>Powering<br />Smarter <em>Hospital</em><br />Operations</h2>
              <p>Manage patient queries, AI pipeline results, and hospital workflows from one secure dashboard.</p>
            </div>

            <div className="adm-lbot">
              <div className="adm-features">
                <div className="adm-feat">
                  <div className="adm-feat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <strong>Secure<br />Access</strong>
                  <span>Enterprise‑grade security</span>
                </div>
                <div className="adm-feat">
                  <div className="adm-feat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M6 21v-1a6 6 0 0 1 12 0v1"/><path d="M17 11l2 2 4-4"/>
                    </svg>
                  </div>
                  <strong>Role<br />Based</strong>
                  <span>Protected admin dashboard</span>
                </div>
                <div className="adm-feat">
                  <div className="adm-feat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 4-6"/>
                    </svg>
                  </div>
                  <strong>Real‑time<br />Insights</strong>
                  <span>Monitor hospital operations</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="adm-right">
            <a className="adm-back" href="/" aria-label="Back to main site">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 6l-6 6 6 6"/>
              </svg>
              Back
            </a>

            <div className="adm-card">
              <div className="adm-shield" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                </svg>
              </div>

              <h1>Admin Login</h1>
              <p className="adm-sub">
                Secure access to Navajeevana Ortho Hospitals<br />administration panel
              </p>

              <div className={`adm-error${error ? ' show' : ''}`} role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{error}</span>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Username */}
                <div className="adm-field">
                  <label className="adm-label" htmlFor="adm-username">Username</label>
                  <div className="adm-input-wrap">
                    <span className="adm-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
                      </svg>
                    </span>
                    <input
                      id="adm-username"
                      className="adm-input"
                      type="text"
                      defaultValue="ADMINNAVAJEEVANA"
                      readOnly
                      autoComplete="username"
                    />
                    <span className="adm-input-lock">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className="adm-field">
                  <label className="adm-label" htmlFor="adm-password">Password</label>
                  <div className="adm-input-wrap">
                    <span className="adm-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                      </svg>
                    </span>
                    <input
                      ref={pwdRef}
                      id="adm-password"
                      className="adm-input"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={btnState !== 'idle'}
                    />
                    <button
                      type="button"
                      className="adm-pwd-toggle"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPwd(v => !v)}
                    >
                      {showPwd ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C6 20 2 12 2 12a17.5 17.5 0 0 1 2.06-3.94"/>
                          <path d="M9.9 4.24A9 9 0 0 1 12 4c6 0 10 8 10 8a17.5 17.5 0 0 1-1.67 2.68"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember + forgot */}
                <div className="adm-row-extras">
                  <label className="adm-check-wrap">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={e => setRemember(e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <div className={`adm-check-box${remember ? ' checked' : ''}`}>
                      <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    </div>
                    <span className="adm-check-label">Remember me</span>
                  </label>
                  <a className="adm-forgot" href="#" onClick={e => e.preventDefault()}>Forgot Password?</a>
                </div>

                {/* Submit */}
                <button
                  className={`adm-btn${btnState === 'success' ? ' success' : ''}`}
                  type="submit"
                  disabled={btnState !== 'idle'}
                >
                  {btnState === 'loading' && (
                    <>
                      <svg className="adm-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9" strokeOpacity=".25"/>
                        <path d="M12 3a9 9 0 0 1 9 9"/>
                      </svg>
                      Verifying credentials…
                    </>
                  )}
                  {btnState === 'success' && (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                        <path d="M5 12l5 5L20 7"/>
                      </svg>
                      Access Granted
                    </>
                  )}
                  {btnState === 'idle' && (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                      </svg>
                      Login to Dashboard
                    </>
                  )}
                </button>
              </form>

              <div className="adm-divider"><span>Secure Admin Access</span></div>

              <div className="adm-sec-note">
                <div className="adm-sec-note-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <p>This is a protected area. All activities are<br />monitored and recorded.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
