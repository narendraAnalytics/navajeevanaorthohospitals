'use client'

import { useEffect, useRef, useState } from 'react'

const testimonials = [
  {
    q: 'My knee replacement surgery changed my life. The doctors and staff at Navajeevana Ortho Hospitals were exceptional throughout my recovery.',
    n: 'Lakshmi Devi',
    r: 'Knee Replacement Patient',
    a: 'L',
  },
  {
    q: 'After my spine surgery I was walking pain-free within weeks. The rehabilitation team guided me at every single step.',
    n: 'Mohan Rao',
    r: 'Spine Surgery Patient',
    a: 'M',
  },
  {
    q: 'World-class facilities and surgeons who truly care. The AI support answered all my questions before and after the procedure.',
    n: 'Fatima Sheikh',
    r: 'Hip Replacement Patient',
    a: 'F',
  },
]

export default function TestimonialsSection() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  const go = (next: number) => {
    setVisible(false)
    setTimeout(() => {
      setIdx(next)
      setVisible(true)
    }, 180)
  }

  useEffect(() => {
    const t = setInterval(() => go((idx + 1) % testimonials.length), 6500)
    return () => clearInterval(t)
  }, [idx])

  const t = testimonials[idx]

  return (
    <section className="bsection" id="appointments" data-screen-label="Testimonials">
      <div className="bwrap duo">
        {/* Testimonials */}
        <div className="panel warm2" style={{ padding: 34 }}>
          <div className="eyebrow te-warm" style={{ marginBottom: 16 }}>What Our Patients Say</div>
          <div
            className="tcard"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity .4s ease' }}
          >
            <div className="stars">★★★★★</div>
            <blockquote>&ldquo;{t.q}&rdquo;</blockquote>
            <div className="who">
              <div className="av">{t.a}</div>
              <div>
                <b>{t.n}</b>
                <br />
                <span>{t.r}</span>
              </div>
            </div>
          </div>
          <div className="tnav">
            <button
              onClick={() => go((idx - 1 + testimonials.length) % testimonials.length)}
              aria-label="Previous"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={16} height={16}>
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button onClick={() => go((idx + 1) % testimonials.length)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} width={16} height={16}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* AI Card */}
        <div className="ai-card reveal" id="insurance">
          <div className="ai-spark" style={{ left: '30%', top: '14%', width: 8, height: 8 }} />
          <div className="ai-spark" style={{ left: '46%', top: '30%', width: 6, height: 6, animationDelay: '.6s' }} />
          <div className="ai-spark" style={{ right: '40%', top: '54%', width: 7, height: 7, animationDelay: '1.1s' }} />
          <h3>
            AI Patient Support <span className="te-grn">24/7</span>
          </h3>
          <ul className="ai-list">
            {[
              'Appointment & Scheduling Queries',
              'Insurance & Billing Assistance',
              'Test Preparation Guidance',
              'Post-Treatment Care Support',
              'Instant Ticket Creation & Tracking',
            ].map((item) => (
              <li key={item}>
                <span className="ck">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="ai-bot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <rect x={4} y={8} width={16} height={11} rx={4} />
              <path d="M12 4v4M9 13h.01M15 13h.01M9 16h6" />
              <circle cx={12} cy={4} r={1.4} fill="currentColor" />
              <path d="M2 12v3m20-3v3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
