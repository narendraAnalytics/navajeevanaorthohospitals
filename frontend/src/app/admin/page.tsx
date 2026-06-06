'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminHome() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== '1') {
      router.replace('/admin/login')
    } else {
      setAuthChecked(true)
    }
  }, [router])

  const handleSignOut = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/admin/login')
  }

  if (!authChecked) return null

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .adh-body {
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #FFF8F5;
          background-image:
            radial-gradient(ellipse 70% 60% at 0% 0%,   rgba(255,180,140,.32) 0%, transparent 60%),
            radial-gradient(ellipse 60% 55% at 100% 0%,  rgba(200,180,255,.3)  0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 100% 100%,rgba(180,230,255,.22) 0%, transparent 55%);
          min-height: 100vh;
          overflow: hidden;
        }

        /* Decorative arcs */
        .adh-arc {
          position: fixed;
          top: -180px; right: -180px;
          width: 520px; height: 520px;
          border-radius: 50%;
          border: 2px solid rgba(200,170,255,.25);
          pointer-events: none; z-index: 0;
        }
        .adh-arc2 {
          position: fixed;
          top: -120px; right: -120px;
          width: 380px; height: 380px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,160,120,.18);
          pointer-events: none; z-index: 0;
        }

        /* TOP BAR */
        .adh-topbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 40px;
        }
        .adh-logo {
          display: flex; align-items: center; gap: 12px; text-decoration: none;
        }
        .adh-logo-text strong {
          display: block; font-family: "Sora", system-ui, sans-serif;
          font-size: 15px; font-weight: 800; color: #13B5A4; letter-spacing: -.01em;
          line-height: 1.1;
        }
        .adh-logo-text span { font-size: 11px; color: #7E93A7; font-weight: 500; }
        .adh-actions { display: flex; align-items: center; gap: 10px; }
        .adh-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 30px;
          font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: none; text-decoration: none;
          transition: all .2s;
          background: rgba(255,255,255,.72);
          border: 1.5px solid rgba(16,42,40,.13);
          color: #1A2E3B;
          backdrop-filter: blur(14px);
          box-shadow: 0 4px 18px -8px rgba(16,42,40,.14);
        }
        .adh-btn:hover { background: #fff; box-shadow: 0 6px 24px -8px rgba(16,42,40,.2); }
        .adh-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
        .adh-divider { width: 1px; height: 28px; background: rgba(16,42,40,.12); }

        /* MAIN GRID */
        .adh-main {
          position: relative; z-index: 1;
          display: grid;
          grid-template-columns: 46% 1fr;
          height: 100vh;
          padding-top: 72px;
          padding-bottom: 68px;
        }

        /* LEFT PANEL */
        .adh-left {
          padding: 20px 36px 20px 44px;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .adh-left > * {
          opacity: 0; transform: translateY(20px);
          animation: adh-rise-in .6s cubic-bezier(.22,1,.36,1) both;
        }
        .adh-badge    { animation-delay: .1s; }
        .adh-heading  { animation-delay: .18s; }
        .adh-tagline  { animation-delay: .24s; }
        .adh-features { animation-delay: .36s; }
        .adh-btn-row  { animation-delay: .44s; }
        @keyframes adh-rise-in { to { opacity:1; transform:translateY(0); } }

        .adh-welcome-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,100,100,.08); border: 1.5px solid rgba(255,100,100,.18);
          border-radius: 30px; padding: 4px 12px;
          font-size: 10.5px; font-weight: 700; color: #D45B45;
          margin-bottom: 7px; width: fit-content;
        }
        .adh-welcome-badge svg { width: 12px; height: 12px; }

        .adh-main-heading {
          font-family: "Sora", system-ui, sans-serif;
          font-size: clamp(26px, 3.4vw, 40px);
          font-weight: 900; line-height: 1.0; letter-spacing: -.035em;
          margin-bottom: 4px;
          background: linear-gradient(115deg, #E8445A 0%, #A259FF 55%, #FF7A00 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }

        .adh-tagline {
          font-family: "Sora", system-ui, sans-serif;
          font-size: clamp(12px, 1.4vw, 16px);
          font-weight: 700; line-height: 1.2;
          margin-bottom: 10px; letter-spacing: -.02em;
        }
        .adh-tag-coral  { color: #FF6B35; }
        .adh-tag-blue   { color: #2E9EF4; }
        .adh-tag-purple { background: linear-gradient(90deg,#A259FF,#FF7A00); -webkit-background-clip:text; background-clip:text; color:transparent; }

        .adh-features { display: grid; grid-template-columns: 1fr; gap: 9px; margin-bottom: 0; flex-shrink: 0; }
        .adh-feat-row {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 9px 11px;
          background: rgba(255,255,255,.72);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.92);
          box-shadow: 0 2px 10px -4px rgba(16,42,40,.09);
          backdrop-filter: blur(8px);
        }
        .adh-feat-icon {
          width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(232,68,90,.1);
        }
        .adh-feat-icon svg { width: 14px; height: 14px; }
        .adh-feat-icon.purple { background: rgba(162,89,255,.1); }
        .adh-feat-icon.green  { background: rgba(17,181,164,.1); }
        .adh-feat-icon.orange { background: rgba(255,122,0,.1); }
        .adh-feat-content strong {
          display: block; font-size: 11px; font-weight: 700; line-height: 1.2; margin-bottom: 2px;
        }
        .adh-feat-content span { font-size: 10px; color: #7E93A7; line-height: 1.35; display: block; }
        .adh-fc-red    strong { color: #E8445A; }
        .adh-fc-purple strong { color: #A259FF; }
        .adh-fc-green  strong { color: #0D9488; }
        .adh-fc-orange strong { color: #FF7A00; }

        .adh-btn-row { display: flex; gap: 10px; align-items: center; margin-top: auto; padding-top: 14px; flex-shrink: 0; }
        .adh-btn-dashboard {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 12px;
          background: linear-gradient(120deg, #FF6B35 0%, #E8445A 50%, #A259FF 100%);
          color: #fff; font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 13px; font-weight: 700; border: none; cursor: pointer;
          text-decoration: none;
          box-shadow: 0 10px 30px -10px rgba(232,68,90,.55);
          transition: transform .2s, box-shadow .2s;
        }
        .adh-btn-dashboard:hover { transform: translateY(-2px); box-shadow: 0 14px 36px -10px rgba(232,68,90,.65); }
        .adh-btn-dashboard svg { width: 15px; height: 15px; }
        .adh-btn-website {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 12px;
          background: rgba(255,255,255,.7); backdrop-filter: blur(14px);
          border: 1.5px solid rgba(16,42,40,.14);
          color: #1A2E3B; font-family: "Plus Jakarta Sans", system-ui, sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 18px -8px rgba(16,42,40,.14);
          transition: all .2s;
        }
        .adh-btn-website:hover { background: #fff; box-shadow: 0 8px 26px -8px rgba(16,42,40,.18); }
        .adh-btn-website svg { width: 15px; height: 15px; color: #2E9EF4; }

        /* RIGHT PANEL */
        .adh-right {
          position: relative;
          display: flex; align-items: center; justify-content: flex-start;
          padding: 10px 0 10px 10px;
          overflow: hidden;
        }

        /* Mockup */
        .adh-mockup {
          background: #fff;
          border-radius: 22px 0 0 22px;
          box-shadow:
            0 32px 80px -20px rgba(16,42,40,.25),
            0 0 0 1px rgba(255,255,255,.5),
            inset 0 1px 0 rgba(255,255,255,.9);
          width: 104%;
          height: calc(100% - 10px);
          overflow: hidden;
          display: grid;
          grid-template-columns: 168px 1fr;
          animation: adh-mockup-in .75s cubic-bezier(.22,1,.36,1) .2s both;
        }
        @keyframes adh-mockup-in {
          from { opacity:0; transform: translateX(40px) scale(.97); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }

        /* Sidebar */
        .adh-mk-sidebar {
          background: #fff; border-right: 1px solid #F0F4F8;
          padding: 16px 10px; display: flex; flex-direction: column; gap: 2px;
        }
        .adh-mk-brand {
          display: flex; align-items: center; gap: 8px;
          padding: 0 6px 14px; border-bottom: 1px solid #F0F4F8; margin-bottom: 10px;
        }
        .adh-mk-brand-txt strong { display: block; font-size: 9px; font-weight: 800; color: #13B5A4; line-height: 1.1; }
        .adh-mk-brand-txt span   { font-size: 8px; color: #9BADA9; }
        .adh-mk-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 9px; border-radius: 9px; cursor: pointer;
          font-size: 10px; font-weight: 600; color: #6E817D;
        }
        .adh-mk-nav.active { background: rgba(232,68,90,.09); color: #E8445A; font-weight: 700; }
        .adh-mk-nav-l { display: flex; align-items: center; gap: 7px; }
        .adh-mk-nav-l svg { width: 12px; height: 12px; flex-shrink: 0; }
        .adh-mk-badge {
          font-size: 9px; font-weight: 700;
          padding: 2px 6px; border-radius: 20px;
          background: rgba(16,42,40,.07); color: #475569;
        }
        .adh-mk-badge.red    { background: rgba(239,68,68,.1); color: #DC2626; }
        .adh-mk-badge.yellow { background: rgba(245,158,11,.1); color: #B45309; }
        .adh-mk-badge.green  { background: rgba(16,185,129,.1); color: #065F46; }
        .adh-mk-divider { height: 1px; background: #F0F4F8; margin: 6px 0; }

        /* Mockup main */
        .adh-mk-main { display: flex; flex-direction: column; background: #F8FAFB; overflow: hidden; }
        .adh-mk-topbar {
          display: flex; align-items: center; justify-content: space-between;
          background: #fff; padding: 10px 18px;
          border-bottom: 1px solid #F0F4F8; flex-shrink: 0;
        }
        .adh-mk-tb-title { font-family: "Sora",system-ui,sans-serif; font-size: 14px; font-weight: 800; color: #0A1628; }
        .adh-mk-tb-right { display: flex; align-items: center; gap: 10px; }
        .adh-mk-notif {
          position: relative; width: 28px; height: 28px; border-radius: 50%;
          background: #F8FAFB; border: 1px solid #E9EFF4;
          display: flex; align-items: center; justify-content: center;
        }
        .adh-mk-notif svg { width: 13px; height: 13px; color: #6E817D; }
        .adh-mk-notif-dot {
          position: absolute; top: 4px; right: 4px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #E8445A; border: 1.5px solid #fff;
        }
        .adh-mk-greeting { font-size: 10px; font-weight: 600; color: #6E817D; }
        .adh-mk-avatar {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg,#13B5A4,#0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: #fff;
        }

        /* Stats */
        .adh-mk-stats {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 10px; padding: 12px 16px 10px; flex-shrink: 0;
        }
        .adh-mk-stat {
          background: #fff; border-radius: 10px; padding: 10px 12px;
          border: 1px solid #EDF2F6;
        }
        .adh-mk-stat-lbl { font-size: 8.5px; color: #9BADA9; font-weight: 600; margin-bottom: 3px; }
        .adh-mk-stat-val { font-family: "Sora",system-ui,sans-serif; font-size: 22px; font-weight: 800; color: #0A1628; line-height: 1; margin-bottom: 3px; }
        .adh-mk-stat-val.teal   { color: #0D9488; }
        .adh-mk-stat-val.orange { color: #F97316; }
        .adh-mk-stat-val.green  { color: #10B981; }
        .adh-mk-stat-trend { font-size: 8px; color: #10B981; font-weight: 700; }

        /* Table section */
        .adh-mk-section { padding: 0 16px 8px; flex-shrink: 0; }
        .adh-mk-section-hd {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 7px;
        }
        .adh-mk-section-hd strong { font-size: 11px; font-weight: 700; color: #0A1628; }
        .adh-mk-section-hd a { font-size: 9.5px; color: #E8445A; font-weight: 700; text-decoration: none; }
        .adh-mk-table { width: 100%; border-collapse: collapse; }
        .adh-mk-table th {
          font-size: 8px; font-weight: 700; color: #9BADA9;
          text-align: left; padding: 4px 6px; letter-spacing: .04em;
          text-transform: uppercase; border-bottom: 1px solid #F0F4F8;
        }
        .adh-mk-table td {
          font-size: 9px; color: #475569; font-weight: 600;
          padding: 6px 6px; border-bottom: 1px solid #F8FAFB;
          white-space: nowrap;
        }
        .adh-mk-table td:first-child { color: #0A1628; font-weight: 700; }
        .adh-mk-pill {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 8px; font-weight: 700;
        }
        .adh-mp-escalate  { background: rgba(249,115,22,.12); color: #C2410C; }
        .adh-mp-autoreply { background: rgba(16,185,129,.12); color: #065F46; }
        .adh-mk-review-btn {
          background: none; border: 1px solid rgba(162,89,255,.3);
          border-radius: 6px; padding: 2px 8px;
          font-size: 8px; font-weight: 700; color: #A259FF; cursor: pointer;
        }

        /* Charts */
        .adh-mk-charts {
          display: grid; grid-template-columns: 1fr 200px;
          gap: 10px; padding: 6px 16px 12px; flex: 1; min-height: 0;
        }
        .adh-mk-chart-card {
          background: #fff; border-radius: 10px;
          border: 1px solid #EDF2F6; padding: 10px 12px;
          overflow: hidden;
        }
        .adh-mk-chart-title { font-size: 9px; font-weight: 700; color: #0A1628; margin-bottom: 6px; }
        .adh-chart-donut { display: flex; align-items: center; gap: 8px; height: 70px; }
        .adh-donut-legend { display: flex; flex-direction: column; gap: 3px; }
        .adh-dl-item { display: flex; align-items: center; gap: 5px; font-size: 7.5px; color: #6E817D; }
        .adh-dl-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* BOTTOM BAR */
        .adh-bottombar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          background: rgba(255,255,255,.82);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(16,42,40,.07);
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 44px;
          gap: 20px;
        }
        .adh-bb-left { display: flex; align-items: center; gap: 0; }
        .adh-bb-stat {
          display: flex; align-items: center; gap: 10px;
          padding: 0 24px;
          border-right: 1px solid rgba(16,42,40,.08);
        }
        .adh-bb-stat:first-child { padding-left: 0; }
        .adh-bb-stat-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .adh-bb-stat-icon svg { width: 17px; height: 17px; }
        .adh-bb-stat-icon.teal   { background: rgba(17,181,164,.1); color: #0D9488; }
        .adh-bb-stat-icon.purple { background: rgba(162,89,255,.1); color: #A259FF; }
        .adh-bb-stat-icon.coral  { background: rgba(232,68,90,.1);  color: #E8445A; }
        .adh-bb-stat-icon.orange { background: rgba(255,122,0,.1);  color: #FF7A00; }
        .adh-bb-stat-txt strong { display: block; font-size: 12.5px; font-weight: 800; color: #0A1628; }
        .adh-bb-stat-txt span   { font-size: 10.5px; color: #7E93A7; font-weight: 500; }

        .adh-bb-right { display: flex; align-items: center; gap: 0; }
        .adh-bb-r-text { text-align: left; margin-right: 20px; }
        .adh-bb-r-text strong { display: block; font-size: 12px; font-weight: 800; color: #0A1628; line-height: 1.25; }
        .adh-bb-r-text span   { font-size: 10.5px; color: #7E93A7; }
        .adh-pipeline { display: flex; align-items: center; gap: 6px; }
        .adh-pf-step { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
        .adh-pf-icon {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .adh-pf-icon svg { width: 16px; height: 16px; color: #fff; }
        .adh-pf-icon.teal   { background: linear-gradient(135deg,#13B5A4,#0D9488); }
        .adh-pf-icon.purple { background: linear-gradient(135deg,#A259FF,#7C3AED); }
        .adh-pf-icon.coral  { background: linear-gradient(135deg,#E8445A,#C82040); }
        .adh-pf-icon.green  { background: linear-gradient(135deg,#10B981,#059669); }
        .adh-pf-label { font-size: 9px; font-weight: 700; color: #6E817D; white-space: nowrap; }
        .adh-pf-arrow { color: rgba(16,42,40,.22); flex-shrink: 0; }
        .adh-pf-arrow svg { width: 16px; height: 16px; }
      `}</style>

      <div className="adh-body">
        {/* Decorative arcs */}
        <div className="adh-arc" />
        <div className="adh-arc2" />

        {/* TOP BAR */}
        <header className="adh-topbar">
          <Link href="/" className="adh-logo">
            <Image src="/assets/logo.png" alt="Navajeevana logo" width={48} height={48} style={{ borderRadius: '50%' }} />
            <div className="adh-logo-text">
              <strong>Navajeevana Ortho Hospitals</strong>
              <span>Healing Mobility. Restoring Lives.</span>
            </div>
          </Link>
          <div className="adh-actions">
            <button className="adh-btn" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
              Sign Out
            </button>
            <div className="adh-divider" />
            <Link href="/" className="adh-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Go to Website
            </Link>
          </div>
        </header>

        {/* MAIN */}
        <div className="adh-main">

          {/* LEFT PANEL */}
          <div className="adh-left">

            <div className="adh-welcome-badge adh-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Welcome to Admin Portal
            </div>

            <div className="adh-main-heading adh-heading">Admin Portal</div>

            <div className="adh-tagline">
              <span className="adh-tag-coral">Smart.</span>
              <span className="adh-tag-blue"> Secure.</span>
              <span className="adh-tag-purple"> Human in Loop.</span>
            </div>

            <div className="adh-features">
              <div className="adh-feat-row">
                <div className="adh-feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#E8445A" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="14" rx="3"/>
                    <path d="M3 10h18M7 15h4M15 15h2"/>
                  </svg>
                </div>
                <div className="adh-feat-content adh-fc-red">
                  <strong>Review &amp; Manage Tickets</strong>
                  <span>View AI triaged tickets and patient queries in real time.</span>
                </div>
              </div>

              <div className="adh-feat-row">
                <div className="adh-feat-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#A259FF" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    <path d="M19 11l2 2 4-4"/>
                  </svg>
                </div>
                <div className="adh-feat-content adh-fc-purple">
                  <strong>Human in Loop</strong>
                  <span>Approve AI suggestions or take action with confidence.</span>
                </div>
              </div>

              <div className="adh-feat-row">
                <div className="adh-feat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <div className="adh-feat-content adh-fc-green">
                  <strong>Smart Insights</strong>
                  <span>Track performance, response time and resolution rate.</span>
                </div>
              </div>

              <div className="adh-feat-row">
                <div className="adh-feat-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M3 3v18h18"/>
                    <path d="M7 16l4-4 4 4 4-6"/>
                  </svg>
                </div>
                <div className="adh-feat-content adh-fc-orange">
                  <strong>Secure &amp; Reliable</strong>
                  <span>Enterprise grade security for your hospital operations.</span>
                </div>
              </div>
            </div>

            <div className="adh-btn-row">
              <Link href="/admin/dashboard" className="adh-btn-dashboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
                </svg>
                Dashboard &nbsp;→
              </Link>
              <Link href="/" className="adh-btn-website">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Go to Website &nbsp;→
              </Link>
            </div>
          </div>

          {/* RIGHT PANEL — decorative mockup */}
          <div className="adh-right">
            <div className="adh-mockup">

              {/* Sidebar */}
              <div className="adh-mk-sidebar">
                <div className="adh-mk-brand">
                  <Image src="/assets/logo.png" alt="" width={26} height={26} style={{ borderRadius: '50%' }} />
                  <div className="adh-mk-brand-txt">
                    <strong>Navajeevana<br />Ortho Hospitals</strong>
                    <span>Admin Portal</span>
                  </div>
                </div>

                <div className="adh-mk-nav active">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
                    </svg>
                    Dashboard
                  </span>
                </div>
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/>
                    </svg>
                    All Tickets
                  </span>
                  <span className="adh-mk-badge">128</span>
                </div>
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Escalated
                  </span>
                  <span className="adh-mk-badge red">24</span>
                </div>
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2"/>
                    </svg>
                    AI Suggested
                  </span>
                  <span className="adh-mk-badge yellow">36</span>
                </div>
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12l5 5L20 7"/>
                    </svg>
                    Resolved
                  </span>
                  <span className="adh-mk-badge green">68</span>
                </div>
                <div className="adh-mk-divider" />
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/>
                    </svg>
                    Patients
                  </span>
                </div>
                <div className="adh-mk-nav">
                  <span className="adh-mk-nav-l">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
                    </svg>
                    Reports
                  </span>
                </div>
              </div>

              {/* Mockup main content */}
              <div className="adh-mk-main">
                <div className="adh-mk-topbar">
                  <div className="adh-mk-tb-title">Admin Dashboard</div>
                  <div className="adh-mk-tb-right">
                    <div className="adh-mk-notif">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <div className="adh-mk-notif-dot" />
                    </div>
                    <span className="adh-mk-greeting">Good Morning, Admin ▾</span>
                    <div className="adh-mk-avatar">AD</div>
                  </div>
                </div>

                <div className="adh-mk-stats">
                  <div className="adh-mk-stat">
                    <div className="adh-mk-stat-lbl">Total Tickets</div>
                    <div className="adh-mk-stat-val">128</div>
                    <div className="adh-mk-stat-trend">↑ 12% this week</div>
                  </div>
                  <div className="adh-mk-stat">
                    <div className="adh-mk-stat-lbl">AI Resolved</div>
                    <div className="adh-mk-stat-val teal">36</div>
                    <div className="adh-mk-stat-trend">↑ 9% this week</div>
                  </div>
                  <div className="adh-mk-stat">
                    <div className="adh-mk-stat-lbl">Escalated</div>
                    <div className="adh-mk-stat-val orange">24</div>
                    <div className="adh-mk-stat-trend" style={{ color: '#F97316' }}>↑ 5% this week</div>
                  </div>
                  <div className="adh-mk-stat">
                    <div className="adh-mk-stat-lbl">Resolved</div>
                    <div className="adh-mk-stat-val green">68</div>
                    <div className="adh-mk-stat-trend">↑ 10% this week</div>
                  </div>
                </div>

                <div className="adh-mk-section">
                  <div className="adh-mk-section-hd">
                    <strong>Recent Tickets</strong>
                    <a href="#">View All</a>
                  </div>
                  <table className="adh-mk-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th><th>Patient</th><th>Query</th>
                        <th>AI Suggestion</th><th>Confidence</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['#TKT-245','Ramesh Kumar','Knee pain after surgery','escalate','85%'],
                        ['#TKT-244','Lakshmi Devi','Physiotherapy sessions','autoreply','92%'],
                        ['#TKT-243','Suresh Babu','MRI report query','escalate','60%'],
                        ['#TKT-242','Anitha Reddy','Insurance claim help','autoreply','91%'],
                        ['#TKT-241','Venkatesh','Post surgery care','escalate','68%'],
                      ].map(([id, name, query, type, conf]) => (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{name}</td>
                          <td>{query}</td>
                          <td>
                            <span className={`adh-mk-pill ${type === 'escalate' ? 'adh-mp-escalate' : 'adh-mp-autoreply'}`}>
                              {type === 'escalate' ? 'Escalate' : 'Auto-Reply'}
                            </span>
                          </td>
                          <td>{conf}</td>
                          <td><button className="adh-mk-review-btn">Review</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="adh-mk-charts">
                  <div className="adh-mk-chart-card">
                    <div className="adh-mk-chart-title">
                      Ticket Overview <span style={{ color: '#9BADA9', fontWeight: 500 }}>&nbsp;This Week ▾</span>
                    </div>
                    <svg width="100%" height="70" viewBox="0 0 300 70" fill="none" preserveAspectRatio="none">
                      <polyline points="0,55 50,48 100,35 150,40 200,28 250,32 300,20" stroke="#3B82F6" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="0,62 50,55 100,50 150,52 200,42 250,45 300,38" stroke="#10B981" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="0,65 50,60 100,58 150,62 200,55 250,58 300,52" stroke="#E8445A" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <text x="0" y="70" fontSize="6" fill="#9BADA9">May 10</text>
                      <text x="50" y="70" fontSize="6" fill="#9BADA9">May 11</text>
                      <text x="100" y="70" fontSize="6" fill="#9BADA9">May 12</text>
                      <text x="150" y="70" fontSize="6" fill="#9BADA9">May 13</text>
                      <text x="200" y="70" fontSize="6" fill="#9BADA9">May 14</text>
                      <text x="250" y="70" fontSize="6" fill="#9BADA9">May 15</text>
                    </svg>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                      {[['#3B82F6','Total'],['#10B981','AI Resolved'],['#E8445A','Escalated']].map(([c,l]) => (
                        <span key={l} style={{ fontSize: 8, color: c, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 12, height: 3, background: c, borderRadius: 2, display: 'inline-block' }} />{l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="adh-mk-chart-card">
                    <div className="adh-mk-chart-title">Tickets by Category</div>
                    <div className="adh-chart-donut">
                      <svg width="70" height="70" viewBox="0 0 70 70">
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#F0F4F8" strokeWidth="12"/>
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#3B82F6" strokeWidth="12" strokeDasharray="40.2 117" strokeDashoffset="0" transform="rotate(-90 35 35)"/>
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray="36 121.2" strokeDashoffset="-40.2" transform="rotate(-90 35 35)"/>
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray="29.7 127.5" strokeDashoffset="-76.2" transform="rotate(-90 35 35)"/>
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="29.7 127.5" strokeDashoffset="-105.9" transform="rotate(-90 35 35)"/>
                        <circle cx="35" cy="35" r="25" fill="none" stroke="#E8445A" strokeWidth="12" strokeDasharray="21.5 135.7" strokeDashoffset="-135.6" transform="rotate(-90 35 35)"/>
                      </svg>
                      <div className="adh-donut-legend">
                        {[['#3B82F6','Appointment','38'],['#F59E0B','Test Prep','34'],['#10B981','Post Surgery','28'],['#8B5CF6','Insurance','28'],['#E8445A','Others','38']].map(([c,l,n]) => (
                          <div key={l} className="adh-dl-item">
                            <span className="adh-dl-dot" style={{ background: c }} />
                            {l} <b style={{ marginLeft: 'auto', paddingLeft: 6 }}>{n}</b>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <footer className="adh-bottombar">
          <div className="adh-bb-left">
            {[
              { cls: 'teal', label: 'AI Triage', sub: '8 Parallel Agents', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.22-6.78-1.42 1.42M5.64 18.36l-1.42 1.42M18.36 18.36l-1.42-1.42M5.64 5.64 4.22 4.22"/></svg> },
              { cls: 'purple', label: 'Fast Processing', sub: '< 3 Seconds', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { cls: 'coral', label: 'Human Oversight', sub: 'Better Patient Care', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg> },
              { cls: 'orange', label: 'Secure Platform', sub: '100% Protected', borderNone: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> },
            ].map(({ cls, label, sub, icon, borderNone }) => (
              <div key={label} className="adh-bb-stat" style={borderNone ? { borderRight: 'none' } : {}}>
                <div className={`adh-bb-stat-icon ${cls}`}>{icon}</div>
                <div className="adh-bb-stat-txt">
                  <strong>{label}</strong>
                  <span>{sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="adh-bb-right">
            <div className="adh-bb-r-text">
              <strong>Human Expertise. AI Efficiency.<br />Better Outcomes.</strong>
              <span>You&apos;re in control. AI helps, you decide.</span>
            </div>
            <div className="adh-pipeline">
              {[
                { cls: 'teal', label: 'Patient Query', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { cls: 'purple', label: 'AI Triage', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg> },
                { cls: 'coral', label: 'Admin Review', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg> },
                { cls: 'green', label: 'Action Taken', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg> },
              ].map(({ cls, label, icon }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="adh-pf-step">
                    <div className={`adh-pf-icon ${cls}`}>{icon}</div>
                    <div className="adh-pf-label">{label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="adh-pf-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
