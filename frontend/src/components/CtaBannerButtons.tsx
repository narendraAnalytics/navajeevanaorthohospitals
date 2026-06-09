'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function CtaBannerButtons() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  if (isSignedIn) {
    return (
      <div className="cta-acts">
        <button className="bbtn white lg" onClick={() => router.push('/doctors')}>
          Book Appointment
        </button>
        <button className="bbtn whiteout lg" onClick={() => router.push('/doctors')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
          </svg>
          Call Now
        </button>
      </div>
    )
  }

  return (
    <div className="cta-acts">
      <SignInButton mode="modal" forceRedirectUrl="/doctors">
        <button className="bbtn white lg">Book Appointment</button>
      </SignInButton>
      <SignInButton mode="modal" forceRedirectUrl="/doctors">
        <button className="bbtn whiteout lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
          </svg>
          Call Now
        </button>
      </SignInButton>
    </div>
  )
}
