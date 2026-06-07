'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BookRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/doctors') }, [router])
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748B' }}>
      Redirecting to Book Appointment…
    </div>
  )
}
