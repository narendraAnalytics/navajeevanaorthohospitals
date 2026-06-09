'use client'

import { useEffect, useState } from 'react'

export default function PageReveal() {
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpacity(0))
    const t  = setTimeout(() => setVisible(false), 650)
    return () => { cancelAnimationFrame(id); clearTimeout(t) }
  }, [])

  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#05101E',
      opacity,
      transition: 'opacity 0.6s ease',
      pointerEvents: 'none',
    }} />
  )
}
