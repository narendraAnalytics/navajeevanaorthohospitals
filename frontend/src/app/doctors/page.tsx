'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SignInButton } from '@clerk/nextjs'
import { getAvailableSlots, bookAppointment, getDoctorMonthAvailability, type AppointmentSlot } from '@/lib/api'

// ── DOCTOR DATA ──────────────────────────────────────────────────────────────

interface DoctorInfo {
  id: string
  name: string
  spec: string
  branch: string
  exp: number
  age: number
  qualifications: string
  languages: string
  teleconsult: 'available' | 'limited'
  img: string
}

const DOCTORS: DoctorInfo[] = [
  {
    id: 'dr_arjun_reddy',
    name: 'Dr. Arjun Reddy',
    spec: 'Joint Replacement Surgery',
    branch: 'Vijayawada',
    exp: 24, age: 52,
    qualifications: 'MBBS · MS Orthopedics',
    languages: 'Telugu · English · Hindi',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810639/Dr._Arjun_Reddy_u2yqyp.png',
  },
  {
    id: 'dr_meera_nair',
    name: 'Dr. Meera Nair',
    spec: 'Sports Medicine',
    branch: 'Vijayawada',
    exp: 18, age: 45,
    qualifications: 'MBBS · MS Ortho · Fellowship Sports Med',
    languages: 'Telugu · English',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810639/Dr._Meera_Nair_xstg4x.png',
  },
  {
    id: 'dr_kiran_kumar',
    name: 'Dr. Kiran Kumar',
    spec: 'Spine Care',
    branch: 'Eluru',
    exp: 21, age: 49,
    qualifications: 'MBBS · MS Ortho · Fellowship Spine',
    languages: 'Telugu · English · Hindi',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810639/Dr._Kiran_Kumar_qd99lm.png',
  },
  {
    id: 'dr_priya_sharma',
    name: 'Dr. Priya Sharma',
    spec: 'Pediatric Orthopedics',
    branch: 'Bhimavaram',
    exp: 16, age: 42,
    qualifications: 'MBBS · MS Orthopedics',
    languages: 'Telugu · English',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810642/Dr.Priya_Sharma_f4exwi.png',
  },
  {
    id: 'dr_vivek_rao',
    name: 'Dr. Vivek Rao',
    spec: 'Trauma & Fracture Care',
    branch: 'Bhimavaram',
    exp: 28, age: 54,
    qualifications: 'MBBS · MS Ortho · Fellowship Trauma',
    languages: 'Telugu · English · Hindi',
    teleconsult: 'limited',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810643/Dr._Vivek_Rao_n2wxu9.png',
  },
  {
    id: 'dr_lakshmi_devi',
    name: 'Dr. Lakshmi Devi',
    spec: 'Arthroscopy',
    branch: 'Palakollu',
    exp: 5, age: 47,
    qualifications: 'MBBS · MS Ortho · Fellowship Arthroscopy',
    languages: 'Telugu · English',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810642/Dr._Lakshmi_Devi_qilela.png',
  },
  {
    id: 'dr_sandeep_varma',
    name: 'Dr. Sandeep Varma',
    spec: 'Orthopedic Oncology',
    branch: 'Vijayawada',
    exp: 23, age: 51,
    qualifications: 'MBBS · MS Ortho · Fellowship Oncology',
    languages: 'Telugu · English · Hindi',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810643/Dr._Sandeep_Varma_sfagtp.png',
  },
  {
    id: 'dr_ananya_reddy',
    name: 'Dr. Ananya Reddy',
    spec: 'General Orthopedics',
    branch: 'Eluru',
    exp: 12, age: 39,
    qualifications: 'MBBS · MS Orthopedics',
    languages: 'Telugu · English',
    teleconsult: 'available',
    img: 'https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1780810638/Dr._Ananya_Reddy_dkda4q.png',
  },
]

const BRANCHES = ['All Branches', 'Vijayawada', 'Bhimavaram', 'Eluru', 'Palakollu']
const SPECS = [
  { label: 'All Specialties', value: 'all' },
  { label: 'Joint Replacement', value: 'Joint Replacement Surgery' },
  { label: 'Sports Medicine', value: 'Sports Medicine' },
  { label: 'Spine Care', value: 'Spine Care' },
  { label: 'Pediatric', value: 'Pediatric Orthopedics' },
  { label: 'Trauma Care', value: 'Trauma & Fracture Care' },
  { label: 'Arthroscopy', value: 'Arthroscopy' },
  { label: 'Oncology', value: 'Orthopedic Oncology' },
  { label: 'General', value: 'General Orthopedics' },
]

// ── MONTH CALENDAR ────────────────────────────────────────────────────────────

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function MonthCalendar({ doctorId, selected, onSelect, today }: {
  doctorId: string; selected: string; onSelect: (d: string) => void; today: string
}) {
  const [calDate, setCalDate] = useState(() => {
    const t = new Date(today + 'T00:00:00')
    return new Date(t.getFullYear(), t.getMonth(), 1)
  })
  const [avail, setAvail] = useState<Record<string, number>>({})
  const [calLoading, setCalLoading] = useState(false)

  const year = calDate.getFullYear()
  const month = calDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  useEffect(() => {
    setCalLoading(true)
    getDoctorMonthAvailability(doctorId, monthStr)
      .then(setAvail)
      .catch(() => setAvail({}))
      .finally(() => setCalLoading(false))
  }, [doctorId, monthStr])

  const todayDate = new Date(today + 'T00:00:00')
  const canGoPrev = calDate > new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const fmt = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return (
    <div className="mc-wrap">
      <div className="mc-nav">
        <button className="mc-nav-btn" onClick={() => setCalDate(new Date(year, month - 1, 1))} disabled={!canGoPrev} aria-label="Previous month">‹</button>
        <span className="mc-month-label">{MONTH_NAMES[month]} {year}{calLoading ? ' …' : ''}</span>
        <button className="mc-nav-btn" onClick={() => setCalDate(new Date(year, month + 1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="mc-grid">
        {DOW.map(d => <div key={d} className="mc-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const ds = fmt(day)
          const dow = new Date(ds + 'T00:00:00').getDay()
          const isPast = ds < today
          const isSun = dow === 0
          const booked = avail[ds] ?? 0
          const isFull = booked >= 4
          const isSelected = ds === selected
          const disabled = isPast || isSun || isFull
          const availClass = !isPast && !isSun ? `avail-${Math.min(booked, 4)}` : ''
          const cls = ['mc-day', isPast ? 'past' : '', isSun ? 'sunday' : '', availClass, isSelected ? 'selected' : ''].filter(Boolean).join(' ')
          const title = isSun ? 'Closed on Sundays' : isFull ? 'Fully booked' : isPast ? 'Past date' : `${4 - booked} slot${4 - booked !== 1 ? 's' : ''} available`
          return (
            <div key={ds} className={cls} onClick={() => !disabled && onSelect(ds)} title={title}>
              {day}
            </div>
          )
        })}
      </div>
      <div className="mc-legend">
        <span className="mc-leg avail-1">1 booked</span>
        <span className="mc-leg avail-2">2 booked</span>
        <span className="mc-leg avail-3">3 booked</span>
        <span className="mc-leg avail-4">Full</span>
      </div>
    </div>
  )
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────

interface ModalState {
  doctor: DoctorInfo | null
  open: boolean
}

function BookingModal({
  modal,
  onClose,
}: {
  modal: ModalState
  onClose: () => void
}) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const doctor = modal.doctor

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [slotId, setSlotId] = useState('')
  const [reason, setReason] = useState('')
  const [cameBefore, setCameBefore] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [error, setError] = useState('')

  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  useEffect(() => {
    if (modal.open && user) {
      setName(user.fullName ?? '')
    }
    if (!modal.open) {
      setDate(''); setSlots([]); setSlotId(''); setReason('')
      setCameBefore(null); setError(''); setSlotError(''); setPhone('')
    }
  }, [modal.open, user])

  useEffect(() => {
    if (!loading) { setLoadingMsg(''); return }
    const msgs = ['Checking availability…', 'Securing your slot…', 'Confirming booking…', 'Almost there…']
    let i = 0
    setLoadingMsg(msgs[0])
    const id = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]) }, 1600)
    return () => clearInterval(id)
  }, [loading])

  const fetchSlots = useCallback(async (d: string) => {
    if (!doctor || !d) return
    setSlotsLoading(true)
    setSlots([]); setSlotId(''); setSlotError('')
    try {
      const data = await getAvailableSlots(doctor.id, d)
      setSlots(data)
      const nowStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
      const available = data.filter(s =>
        (s.status === 'available' || s.status === 'held') &&
        !(d === today && s.slot_time <= nowStr)
      )
      if (available.length === 0) {
        setSlotError('All slots for this date are fully booked. Please try another date.')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      const isNetwork = msg.toLowerCase().includes('fetch') || msg.includes('502') || msg.includes('503') || msg.includes('network')
      setSlotError(isNetwork
        ? 'Server is starting up — wait ~30s then click Retry.'
        : `Couldn't load slots: ${msg}`)
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctor])

  const handleDateChange = (v: string) => {
    setDate(v)
    setSlotError('')
    setSlots([]); setSlotId('')
    if (new Date(v + 'T00:00:00').getDay() === 0) {
      setSlotError('Sundays are unavailable — we are open Mon–Sat only.')
      return
    }
    fetchSlots(v)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !date || !slotId || !reason.trim() || cameBefore === null) {
      setError('Please fill in all required fields.')
      return
    }
    const selectedSlot = slots.find(s => s.slot_id === slotId)
    if (!selectedSlot) { setError('Please select a valid slot.'); return }
    setLoading(true); setError('')
    try {
      const result = await bookAppointment({
        patient_name: name,
        patient_email: email,
        patient_phone: phone,
        doctor_id: doctor!.id,
        appointment_date: date,
        appointment_time: selectedSlot.slot_time,
        slot_label: selectedSlot.label,
        slot_id: slotId,
        reason,
        came_before: cameBefore!,
        session_id: crypto.randomUUID(),
      })
      router.push(`/patient/book/confirm/${result.appointment_id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (!doctor) return null

  return (
    <div
      className={`bm-overlay${modal.open ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bm-modal">
        {/* Header */}
        <div className="bm-header">
          <Image
            src={doctor.img}
            alt={doctor.name}
            width={60}
            height={60}
            className="bm-doc-img"
            style={{ objectFit: 'cover', objectPosition: 'top center' }}
          />
          <div className="bm-doc-info">
            <div className="bm-doc-name">{doctor.name}</div>
            <div className="bm-doc-spec">{doctor.spec}</div>
          </div>
          <button className="bm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={15} height={15}>
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
        </div>

        <div className="bm-divider" />

        <div className="bm-body">
            {!isSignedIn ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>Sign in to book an appointment</p>
                <SignInButton mode="redirect" forceRedirectUrl="/doctors">
                  <button className="bm-submit">Sign In to Continue</button>
                </SignInButton>
              </div>
            ) : (
              <>
                <div className="bm-row">
                  <div>
                    <label className="bm-label" htmlFor="bm-name">Full Name *</label>
                    <input id="bm-name" className="bm-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="bm-label" htmlFor="bm-phone">Phone Number *</label>
                    <input id="bm-phone" className="bm-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div>
                  <label className="bm-label" htmlFor="bm-email">Email</label>
                  <input id="bm-email" className="bm-input" type="email" value={email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label className="bm-label">Preferred Date *</label>
                  <MonthCalendar doctorId={doctor.id} selected={date} onSelect={handleDateChange} today={today} />
                </div>
                <div>
                  <label className="bm-label" htmlFor="bm-slot">Time Slot *</label>
                  <select
                    id="bm-slot"
                    className="bm-input bm-select"
                    value={slotId}
                    onChange={e => setSlotId(e.target.value)}
                    disabled={!date || slotsLoading}
                  >
                    <option value="">{slotsLoading ? 'Loading slots…' : date ? slots.length ? 'Select a slot' : 'No slots available' : 'Pick a date first'}</option>
                    {slots.map(s => {
                      const nowStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                      const isBooked = s.status === 'booked'
                      const isPast = date === today && s.slot_time <= nowStr
                      return (
                        <option key={s.slot_id} value={s.slot_id} disabled={isBooked || isPast}>
                          {s.label} ({s.slot_time}){isBooked ? ' — Booked' : isPast ? ' — Passed' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                {slotError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <p className="bm-error" style={{ margin: 0 }}>{slotError}</p>
                    {date && (
                      <button type="button" className="bm-retry-btn" onClick={() => { setSlotError(''); fetchSlots(date) }}>
                        ↺ Retry
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <label className="bm-label">Have you visited before? *</label>
                  <div className="bm-toggle">
                    <button
                      type="button"
                      className={`bm-toggle-btn${cameBefore === true ? ' active' : ''}`}
                      onClick={() => setCameBefore(true)}
                    >Yes</button>
                    <button
                      type="button"
                      className={`bm-toggle-btn${cameBefore === false ? ' active' : ''}`}
                      onClick={() => setCameBefore(false)}
                    >No</button>
                  </div>
                </div>
                <div>
                  <label className="bm-label" htmlFor="bm-reason">Reason for Visit *</label>
                  <textarea
                    id="bm-reason"
                    className="bm-input"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Knee pain for 2 weeks, unable to walk properly…"
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                </div>
                {error && <p className="bm-error">{error}</p>}
                <button className={`bm-submit${loading ? ' loading' : ''}`} onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <><span className="bm-spinner" />{loadingMsg}</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={15} height={15}><path d="M5 12l5 5L20 7" /></svg> Confirm Appointment</>
                  )}
                </button>
              </>
            )}
          </div>
      </div>
    </div>
  )
}

// ── DOCTOR CARD ───────────────────────────────────────────────────────────────

function DoctorCard({ doc, onBook }: { doc: DoctorInfo; onBook: (d: DoctorInfo) => void }) {
  return (
    <div className="dc-card">
      <div className="dc-img-wrap">
        <Image
          src={doc.img}
          alt={doc.name}
          fill
          sizes="(max-width:760px) 50vw, (max-width:1100px) 33vw, 25vw"
          style={{ objectFit: 'cover', objectPosition: 'top center' }}
          className="dc-img"
        />
        <div className="dc-tooltip">
          <div className="dc-tt-inner">
            <div className="dc-tt-name">{doc.name}</div>
            <div className="dc-tt-spec">{doc.spec}</div>
            <div className="dc-tt-rows">
              <div className="dc-tt-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><circle cx={12} cy={12} r={10} /><polyline points="12 6 12 12 16 14" /></svg>
                {doc.exp} Years Experience
              </div>
              <div className="dc-tt-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx={12} cy={10} r={3} /></svg>
                {doc.branch}
              </div>
              <div className="dc-tt-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.84-.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                {doc.languages}
              </div>
              <div className="dc-tt-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={12} height={12}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                {doc.qualifications}
              </div>
            </div>
            {doc.teleconsult === 'available' ? (
              <div className="dc-tt-badge avail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={10} height={10}><path d="M5 12l5 5L20 7" /></svg>
                Teleconsultation Available
              </div>
            ) : (
              <div className="dc-tt-badge limited">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width={10} height={10}><circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>
                Teleconsultation Limited
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="dc-info">
        <div className="dc-name">{doc.name}</div>
        <div className="dc-specialty">{doc.spec}</div>
        <div className="dc-meta">
          <span className="dc-meta-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={11} height={11}><circle cx={12} cy={12} r={10} /><polyline points="12 6 12 12 16 14" /></svg>
            {doc.exp} yrs exp
          </span>
          <span className="dc-meta-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" width={11} height={11}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx={12} cy={10} r={3} /></svg>
            {doc.branch}
          </span>
        </div>
        <button className="dc-btn" onClick={() => onBook(doc)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={14} height={14}><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>
          Book Appointment
        </button>
      </div>
    </div>
  )
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const [activeBranch, setActiveBranch] = useState('All Branches')
  const [activeSpec, setActiveSpec] = useState('all')
  const [modal, setModal] = useState<ModalState>({ doctor: null, open: false })

  const filtered = DOCTORS.filter(d => {
    const branchOk = activeBranch === 'All Branches' || d.branch === activeBranch
    const specOk = activeSpec === 'all' || d.spec === activeSpec
    return branchOk && specOk
  })

  const openModal = (doc: DoctorInfo) => setModal({ doctor: doc, open: true })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modal.open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal.open])

  return (
    <>
      <style>{`
        /* ── BG ORBS ── */
        .dp-orbs{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
        .dp-orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.35;animation:dp-float 18s ease-in-out infinite}
        .dp-orb.a{width:500px;height:500px;left:-180px;top:-140px;background:radial-gradient(circle,#9DF0D6,transparent 70%)}
        .dp-orb.b{width:440px;height:440px;right:-160px;top:300px;background:radial-gradient(circle,#FFD0BB,transparent 70%);animation-delay:-6s}
        .dp-orb.c{width:380px;height:380px;left:40%;bottom:-180px;background:radial-gradient(circle,#C7F0FF,transparent 70%);animation-delay:-12s}
        @keyframes dp-float{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,-22px)}}

        /* ── HEADER ── */
        .dp-header{position:sticky;top:14px;left:0;right:0;z-index:50;display:flex;justify-content:center;padding:0 14px;background:transparent;border-bottom:none}
        .dp-header-inner{width:min(1280px,100%);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:10px 24px;border-radius:60px;background:rgba(255,255,255,.55);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);border:1px solid rgba(255,255,255,.75);box-shadow:0 14px 40px -16px rgba(16,42,40,.30),inset 0 1px 0 rgba(255,255,255,.8)}
        .dp-back{justify-self:start;display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:50px;background:#E6F9F7;border:1.5px solid rgba(17,181,164,.3);color:#0C8E84;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;transition:all .2s;white-space:nowrap;font-family:var(--font-body)}
        .dp-back:hover{background:#11B5A4;color:#fff;transform:translateX(-2px)}
        .dp-brand{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:var(--ink)}
        .dp-brand strong{font-family:var(--font-head);font-size:14px;font-weight:800;color:#11B5A4}
        .dp-brand span{font-size:11px;color:var(--bk-muted);display:block;line-height:1.4;text-align:center}
        .dp-header-title{justify-self:end;font-family:var(--font-head);font-size:15px;font-weight:800;color:var(--ink)}

        /* ── PAGE ── */
        .dp-page{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:40px 32px 80px}

        /* ── HERO ── */
        .dp-hero{text-align:center;margin-bottom:40px}
        .dp-eyebrow{display:inline-flex;align-items:center;gap:7px;background:#E6F9F7;border:1px solid rgba(17,181,164,.3);color:#0C8E84;font-size:12px;font-weight:700;padding:6px 16px;border-radius:50px;margin-bottom:14px;letter-spacing:.04em;font-family:var(--font-body)}
        .dp-hero h1{font-family:var(--font-head);font-size:clamp(28px,4vw,46px);font-weight:900;color:var(--ink);line-height:1.1;margin-bottom:12px}
        .dp-hero h1 span{background:var(--g-teal);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .dp-hero p{font-size:16px;color:var(--bk-muted);max-width:540px;margin:0 auto;line-height:1.7;font-family:var(--font-body)}

        /* ── FILTER BAR ── */
        .dp-filter{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:36px;background:#fff;border-radius:16px;padding:14px 20px;box-shadow:0 4px 24px rgba(16,42,40,.07);border:1px solid rgba(17,181,164,.1)}
        .dp-filter-label{font-size:12px;font-weight:700;color:var(--bk-muted);margin-right:4px;white-space:nowrap;font-family:var(--font-body)}
        .dp-chips{display:flex;flex-wrap:wrap;gap:7px}
        .dp-chip{padding:6px 14px;border-radius:50px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #E2EDE9;color:var(--bk-muted);background:#FAFCFB;transition:all .18s;white-space:nowrap;font-family:var(--font-body)}
        .dp-chip:hover{border-color:#11B5A4;color:#11B5A4}
        .dp-chip.active{background:var(--g-teal);color:#fff;border-color:transparent;box-shadow:0 4px 14px -4px rgba(17,181,164,.4)}
        .dp-divider-v{width:1px;height:20px;background:#E2EDE9;flex-shrink:0}

        /* ── GRID ── */
        .dp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
        @media(max-width:1100px){.dp-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:760px){.dp-grid{grid-template-columns:repeat(2,1fr);gap:16px}}
        @media(max-width:480px){.dp-grid{grid-template-columns:1fr}}

        /* ── DOCTOR CARD ── */
        .dc-card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px -20px rgba(16,42,40,.18);border:1px solid rgba(17,181,164,.08);transition:transform .28s ease,box-shadow .28s ease;display:flex;flex-direction:column}
        .dc-card:hover{transform:translateY(-6px);box-shadow:0 32px 80px -16px rgba(17,181,164,.28)}
        .dc-img-wrap{position:relative;overflow:hidden;aspect-ratio:3/4;background:#f0f4f2;cursor:pointer}
        .dc-img{transition:transform .4s ease,filter .4s ease!important}
        .dc-card:hover .dc-img{transform:scale(1.04)!important;filter:brightness(.55)!important}
        .dc-tooltip{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;opacity:0;transform:translateY(12px);transition:opacity .32s ease,transform .32s ease;pointer-events:none}
        .dc-card:hover .dc-tooltip{opacity:1;transform:translateY(0)}
        .dc-tt-inner{background:rgba(13,27,42,.82);backdrop-filter:blur(10px);border-radius:14px;padding:16px;border:1px solid rgba(255,255,255,.12)}
        .dc-tt-name{font-family:var(--font-head);font-size:15px;font-weight:800;color:#fff;margin-bottom:2px}
        .dc-tt-spec{font-size:11px;color:#5FD3E6;font-weight:700;margin-bottom:10px}
        .dc-tt-rows{display:flex;flex-direction:column;gap:5px}
        .dc-tt-row{display:flex;align-items:center;gap:7px;font-size:10.5px;color:rgba(255,255,255,.78);font-weight:500;font-family:var(--font-body)}
        .dc-tt-row svg{color:#11B5A4;flex-shrink:0}
        .dc-tt-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:9.5px;font-weight:700;margin-top:8px;font-family:var(--font-body)}
        .dc-tt-badge.avail{background:rgba(16,185,129,.2);color:#6EE7B7}
        .dc-tt-badge.limited{background:rgba(251,191,36,.15);color:#FCD34D}
        .dc-info{padding:14px 16px 6px}
        .dc-name{font-family:var(--font-head);font-size:14px;font-weight:800;color:var(--ink);margin-bottom:2px}
        .dc-specialty{font-size:11px;color:#0C8E84;font-weight:700;margin-bottom:6px;font-family:var(--font-body)}
        .dc-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:2px}
        .dc-meta-chip{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--bk-muted);font-weight:600;font-family:var(--font-body)}
        .dc-btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin:12px 0 14px;padding:11px 16px;border-radius:12px;background:var(--g-teal);color:#fff;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:opacity .18s,transform .18s;font-family:var(--font-body)}
        .dc-btn:hover{opacity:.92;transform:scale(1.02)}

        /* ── NO RESULTS ── */
        .dp-no-results{grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--bk-muted)}
        .dp-no-results svg{opacity:.3;margin:0 auto 12px;display:block}
        .dp-no-results p{font-size:15px;font-weight:600;font-family:var(--font-body)}

        /* ── BOOKING MODAL ── */
        .bm-overlay{position:fixed;inset:0;z-index:100;background:rgba(13,27,42,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s ease}
        .bm-overlay.open{opacity:1;pointer-events:all}
        .bm-modal{background:#fff;border-radius:24px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 40px 100px -20px rgba(13,27,42,.4);transform:translateY(20px) scale(.97);transition:transform .28s ease;position:relative}
        .bm-overlay.open .bm-modal{transform:translateY(0) scale(1)}
        .bm-modal::-webkit-scrollbar{width:4px}
        .bm-modal::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:2px}
        .bm-header{padding:24px 24px 0;display:flex;align-items:flex-start;gap:14px}
        .bm-doc-img{border-radius:14px;border:2px solid #E6F9F7;flex-shrink:0}
        .bm-doc-info{flex:1;min-width:0}
        .bm-doc-name{font-family:var(--font-head);font-size:17px;font-weight:900;color:var(--ink);margin-bottom:2px}
        .bm-doc-spec{font-size:12px;color:#0C8E84;font-weight:700;font-family:var(--font-body)}
        .bm-close{width:34px;height:34px;border-radius:50%;background:#F1F5F9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;margin-left:auto}
        .bm-close:hover{background:#E2E8F0}
        .bm-divider{height:1px;background:linear-gradient(to right,transparent,rgba(17,181,164,.15),transparent);margin:16px 24px}
        .bm-body{padding:0 24px 24px;display:flex;flex-direction:column;gap:14px}
        .bm-label{font-size:12px;font-weight:700;color:var(--bk-muted);margin-bottom:5px;display:block;letter-spacing:.03em;font-family:var(--font-body)}
        .bm-input{width:100%;padding:11px 14px;border-radius:10px;border:1.5px solid #E2EDE9;font-family:var(--font-body);font-size:13.5px;color:var(--ink);background:#FAFCFB;outline:none;transition:border-color .18s;box-sizing:border-box}
        .bm-input:focus{border-color:#11B5A4;background:#fff}
        .bm-select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E817D' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:#FAFCFB;padding-right:32px}
        .bm-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .bm-toggle{display:flex;gap:8px;margin-top:4px}
        .bm-toggle-btn{flex:1;padding:9px;border-radius:10px;border:1.5px solid #E2EDE9;background:#FAFCFB;color:var(--bk-muted);font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;font-family:var(--font-body)}
        .bm-toggle-btn.active{background:var(--g-teal);color:#fff;border-color:transparent}
        .bm-submit{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:12px;background:var(--g-teal);color:#fff;font-size:14px;font-weight:700;cursor:pointer;border:none;font-family:var(--font-body);transition:opacity .18s,transform .18s;margin-top:4px;width:100%}
        .bm-submit:hover:not(:disabled){opacity:.9;transform:scale(1.01)}
        .bm-submit:disabled{opacity:.6;cursor:not-allowed}
        .bm-submit.loading{background:linear-gradient(90deg,#0fa898,#11B5A4,#3ecfc0,#11B5A4,#0fa898);background-size:300% 100%;animation:bm-shimmer 2s linear infinite,bm-pulse 1.6s ease-in-out infinite;opacity:1}
        @keyframes bm-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
        @keyframes bm-pulse{0%,100%{opacity:1}50%{opacity:.82}}
        .bm-error{color:#ef4444;font-size:12px;font-weight:600;font-family:var(--font-body)}
        .bm-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:bm-spin .7s linear infinite;flex-shrink:0}
        @keyframes bm-spin{to{transform:rotate(360deg)}}
        .bm-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:40px 24px;gap:12px}
        .bm-success-icon{width:68px;height:68px;border-radius:50%;background:var(--g-teal);display:flex;align-items:center;justify-content:center;color:#fff}
        .bm-success-title{font-family:var(--font-head);font-size:20px;font-weight:900;color:var(--ink)}
        .bm-success-sub{font-size:13px;color:var(--bk-muted);line-height:1.6;max-width:320px;font-family:var(--font-body)}
        .bm-success-name{color:#0C8E84;font-weight:700}
        .bm-done-btn{padding:11px 28px;border-radius:12px;background:#E6F9F7;border:1.5px solid rgba(17,181,164,.3);color:#0C8E84;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all .18s;margin-top:8px}
        .bm-done-btn:hover{background:#11B5A4;color:#fff}
        .bm-retry-btn{padding:5px 14px;border-radius:8px;background:#E6F9F7;border:1.5px solid rgba(17,181,164,.3);color:#0C8E84;font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all .18s;flex-shrink:0}
        .bm-retry-btn:hover{background:#11B5A4;color:#fff}

        /* ── MONTH CALENDAR ── */
        .mc-wrap{background:#F8FDFB;border-radius:12px;border:1.5px solid #E2EDE9;overflow:hidden}
        .mc-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fff;border-bottom:1px solid #E2EDE9}
        .mc-nav-btn{background:none;border:none;cursor:pointer;padding:4px 10px;border-radius:6px;color:#0C8E84;font-size:20px;font-weight:700;line-height:1;transition:background .15s}
        .mc-nav-btn:hover:not(:disabled){background:#E6F9F7}
        .mc-nav-btn:disabled{color:#C5D0CE;cursor:default}
        .mc-month-label{font-family:var(--font-head);font-size:13px;font-weight:800;color:var(--ink)}
        .mc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:10px}
        .mc-dow{text-align:center;font-size:10px;font-weight:700;color:var(--bk-muted);padding:4px 0;font-family:var(--font-body)}
        .mc-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all .15s;color:var(--ink)}
        .mc-day:hover:not(.past):not(.sunday):not(.avail-4){filter:brightness(.92)}
        .mc-day.selected{outline:2.5px solid #11B5A4;outline-offset:1px;font-weight:800}
        .mc-day.past{color:#C5D0CE!important;cursor:default;background:transparent!important}
        .mc-day.sunday{color:#C5D0CE!important;cursor:default;background:transparent!important}
        .mc-day.avail-0{background:transparent}
        .mc-day.avail-1{background:#D1FAE5;color:#065F46}
        .mc-day.avail-2{background:#FEF3C7;color:#92400E}
        .mc-day.avail-3{background:#FFEDD5;color:#9A3412}
        .mc-day.avail-4{background:#FEE2E2;color:#991B1B;cursor:not-allowed}
        .mc-legend{display:flex;gap:8px;padding:8px 12px;border-top:1px solid #E2EDE9;flex-wrap:wrap;align-items:center}
        .mc-leg{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;font-family:var(--font-body)}
        .mc-leg.avail-1{background:#D1FAE5;color:#065F46}
        .mc-leg.avail-2{background:#FEF3C7;color:#92400E}
        .mc-leg.avail-3{background:#FFEDD5;color:#9A3412}
        .mc-leg.avail-4{background:#FEE2E2;color:#991B1B}
      `}</style>

      <div style={{ fontFamily: 'var(--font-body)', background: 'var(--ivory)', color: 'var(--ink)', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>

        {/* Orbs */}
        <div className="dp-orbs" aria-hidden="true">
          <div className="dp-orb a" />
          <div className="dp-orb b" />
          <div className="dp-orb c" />
        </div>

        {/* Sticky Header */}
        <header className="dp-header">
          <div className="dp-header-inner">
            <Link href="/" className="dp-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" width={14} height={14}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <Link href="/" className="dp-brand">
              <div>
                <strong>Navajeevana Ortho Hospitals</strong>
                <span>Healing Mobility · Restoring Lives</span>
              </div>
            </Link>
            <div className="dp-header-title">Our Specialists</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dp-page">

          {/* Hero */}
          <div className="dp-hero">
            <div className="dp-eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" width={13} height={13}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Expert Orthopedic Specialists
            </div>
            <h1>Meet Our <span>Doctors</span></h1>
            <p>Book an appointment with our experienced orthopedic specialists. Hover over a doctor card to view full details.</p>
          </div>

          {/* Filter Bar */}
          <div className="dp-filter">
            <span className="dp-filter-label">Branch</span>
            <div className="dp-chips">
              {BRANCHES.map(b => (
                <button
                  key={b}
                  className={`dp-chip${activeBranch === b ? ' active' : ''}`}
                  onClick={() => setActiveBranch(b)}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="dp-divider-v" />
            <span className="dp-filter-label">Specialty</span>
            <div className="dp-chips">
              {SPECS.map(s => (
                <button
                  key={s.value}
                  className={`dp-chip${activeSpec === s.value ? ' active' : ''}`}
                  onClick={() => setActiveSpec(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="dp-grid">
            {filtered.length === 0 ? (
              <div className="dp-no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={48} height={48}>
                  <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
                </svg>
                <p>No doctors match these filters.</p>
              </div>
            ) : (
              filtered.map(doc => (
                <DoctorCard key={doc.id} doc={doc} onBook={openModal} />
              ))
            )}
          </div>

        </div>

        {/* Booking Modal */}
        <BookingModal modal={modal} onClose={closeModal} />

      </div>
    </>
  )
}
