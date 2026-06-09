'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useUser, UserButton, SignInButton, Show } from '@clerk/nextjs'

const links = [
  { href: '#home', label: 'Home' },
  { href: '#doctors', label: 'Doctors' },
  { href: '#specialties', label: 'Services' },
  { href: '#treatments', label: 'Treatments' },
  { href: '#contact', label: 'Contact' },
]

const sectionIds = ['home', 'doctors', 'specialties', 'treatments', 'contact']

export default function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState('home')
  const lastY = useRef(0)
  const { user } = useUser()

  useEffect(() => {
    const nav = navRef.current
    const shell = shellRef.current
    if (!nav || !shell) return

    const onScroll = () => {
      const y = window.scrollY
      nav.classList.toggle('scrolled', y > 30)
      shell.style.top = y > lastY.current && y > 200 ? '-90px' : '14px'
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveSection(en.target.id)
        })
      },
      { threshold: 0.4 }
    )
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) spy.observe(el)
    })
    return () => spy.disconnect()
  }, [])

  return (
    <div className="nav-shell" ref={shellRef}>
      <nav className="bnav" ref={navRef}>
        <a className="brand-logo" href="#home">
          <Image src="https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780555373/logo_xr4zab.png" alt="Navajeevana logo" width={38} height={38} style={{ borderRadius: '50%' }} />
          <span className="bt">
            <b>Navajeevana</b>
            <span>Ortho Hospitals · Healing Mobility</span>
          </span>
        </a>

        <div className="nav-links">
          {links.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={activeSection === href.slice(1) ? 'active' : ''}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="nav-cta">
          <Show when="signed-in">
            <span className="nav-welcome">
              Welcome, {user?.firstName || user?.username || 'User'}
            </span>
            <span className="ghost-pill" style={{ cursor: 'default', opacity: 0.75 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                <circle cx={12} cy={8} r={4} />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              Patient Portal
            </span>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <a
              href="https://buildflows.shop/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-portfolio-icon"
              aria-label="Built by BuildFlows"
            >
              <Image
                src="https://res.cloudinary.com/dkqbzwicr/image/upload/e_bgremoval/q_auto/f_auto/v1780985346/porfolioicon_vqyt3j.png"
                alt="BuildFlows"
                width={30}
                height={30}
              />
              <span className="nav-ptip">My Work →</span>
            </a>
            <div className="pp-ring">
              <SignInButton mode="redirect" forceRedirectUrl="/api/auth/sync">
                <button className="ghost-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                    <circle cx={12} cy={8} r={4} />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                  Patient Portal
                </button>
              </SignInButton>
            </div>
            <Link className="bbtn violet" href="/admin">Admin Portal</Link>
          </Show>
          <button className="nav-burger" aria-label="Menu">
            <span />
          </button>
        </div>
      </nav>
    </div>
  )
}
