'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const SLIDES = [
  'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555374/bannerimage1_b8zcjn.png',
  'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/bannerimage3_bi89lk.png',
  'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555372/bannerimage2_rmncs2.png',
  'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780575743/bannerimage4_srk9ls.png',
]

interface CounterProps {
  target: number
  decimals?: number
  suffix?: string
  comma?: boolean
  delay?: number
}

function AnimatedCounter({ target, decimals = 0, suffix = '', comma = false, delay = 0 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ref.current || done.current) return
      done.current = true
      const dur = 1600
      const t0 = performance.now()
      const fmt = (v: number) => {
        let s = decimals ? v.toFixed(decimals) : Math.round(v).toString()
        if (comma) s = Number(s).toLocaleString('en-US')
        return s + suffix
      }
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const e = 1 - Math.pow(1 - p, 3)
        if (ref.current) ref.current.textContent = fmt(target * e)
        if (p < 1) requestAnimationFrame(step)
        else if (ref.current) ref.current.textContent = fmt(target)
      }
      requestAnimationFrame(step)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, decimals, suffix, comma, delay])

  return <span ref={ref}>0</span>
}

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const { isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx(i => (i + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="hero" id="home" data-screen-label="Hero">
      {/* Carousel */}
      <div className="hero-carousel">
        {SLIDES.map((src, i) => (
          <div key={i} className={`hero-slide${activeIdx === i ? ' active' : ''}`}>
            <img src={src} alt="" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Dot nav */}
      <div className="hero-dot-nav">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero-dot${activeIdx === i ? ' active' : ''}`}
            onClick={() => setActiveIdx(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="hero-banner-overlay" />

      <div className="hero-content-wrap">
          <div className="hero-left">
            <div className="trust-chip">
              <span className="dot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              Trusted Orthopedic Care Since 2004
            </div>

            <h1>
              Advanced Orthopedic<br />
              Care <span className="warm">For Every</span><br />
              <span className="green">Stage Of Life</span>
            </h1>

            <div className="spec-row">
              <span>
                <i style={{ background: 'var(--g-teal)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M8 4v6m8-6v6M8 7h8M9 10c0 4-3 4-3 7a3 3 0 006 0c0-3-3-3-3-7m6 0c0 4 3 4 3 7a3 3 0 01-6 0" />
                  </svg>
                </i>
                Joint Replacement
              </span>
              <span>
                <i style={{ background: 'var(--g-teal)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 3v18M9 6h6M9 10h6M9 14h6M9 18h6" />
                  </svg>
                </i>
                Spine Care
              </span>
              <span>
                <i style={{ background: 'var(--g-coral)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M13 4l-2 6h4l-3 10M6 9l3-2m6 9l3-2" />
                  </svg>
                </i>
                Sports Injury
              </span>
              <span>
                <i style={{ background: 'var(--g-coral)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2v4m0 0a6 6 0 016 6v2H6v-2a6 6 0 016-6zM5 16h14l-1 6H6z" />
                  </svg>
                </i>
                Trauma Care
              </span>
              <span>
                <i style={{ background: 'var(--g-violet)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 4l4 8-4 8m12-16l-4 8 4 8M10 12h4" />
                  </svg>
                </i>
                Physiotherapy &amp; Rehabilitation
              </span>
            </div>

            <p className="tline">
              <span className="seal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              Trusted by <b>&nbsp;50,000+&nbsp;</b> Patients Across South India
            </p>

            <div className="hero-ctas">
              {isSignedIn ? (
                <button className="bbtn warm lg" onClick={() => router.push('/patient')}>
                  📅&nbsp; Book Appointment
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <SignInButton mode="redirect" forceRedirectUrl="/patient">
                  <button className="bbtn warm lg">
                    📅&nbsp; Book Appointment
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </SignInButton>
              )}
              {isSignedIn ? (
                <button className="bbtn outline lg" onClick={() => router.push('/patient')}>
                  Ask Our Care Team
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <SignInButton mode="redirect" forceRedirectUrl="/patient">
                  <button className="bbtn outline lg">
                    Ask Our Care Team
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </SignInButton>
              )}
            </div>

            <div className="stat-cards">
              <div className="scard">
                <div className="ico" style={{ background: 'var(--g-warm)' }}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.9 6.3 6.9.6-5.2 4.5 1.6 6.7L12 17l-6.2 3.6 1.6-6.7L2.2 8.9l6.9-.6z" />
                  </svg>
                </div>
                <div className="scard-text">
                  <div className="num"><AnimatedCounter target={4.9} decimals={1} delay={500} /></div>
                  <div className="lab">Patient Rating</div>
                  <div className="stars">★★★★★</div>
                </div>
              </div>
              <div className="scard">
                <div className="ico" style={{ background: 'var(--g-teal)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx={9} cy={8} r={3.2} />
                    <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
                    <path d="M17 8h4m-2-2v4" />
                  </svg>
                </div>
                <div className="scard-text">
                  <div className="num"><AnimatedCounter target={8} suffix="+" delay={500} /></div>
                  <div className="lab">Specialist Doctors</div>
                </div>
              </div>
              <div className="scard">
                <div className="ico" style={{ background: 'var(--g-violet)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                  </svg>
                </div>
                <div className="scard-text">
                  <div className="num"><AnimatedCounter target={20} suffix="+" delay={500} /></div>
                  <div className="lab">Years Excellence</div>
                </div>
              </div>
              <div className="scard">
                <div className="ico" style={{ background: 'var(--g-coral)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx={8} cy={8} r={3} />
                    <circle cx={17} cy={9} r={2.4} />
                    <path d="M2 20c0-3 2.7-4.6 6-4.6s6 1.6 6 4.6M14.5 19c.2-2.3 1.9-3.3 4-3.3 2 0 3.5 1 3.5 3.3" />
                  </svg>
                </div>
                <div className="scard-text">
                  <div className="num"><AnimatedCounter target={50000} suffix="+" comma delay={500} /></div>
                  <div className="lab">Treatments</div>
                </div>
              </div>
            </div>
          </div>
      </div>

    </header>
  )
}
