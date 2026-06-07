const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ---- types ----

export interface Ticket {
  ticket_id: string
  status: 'processing' | 'pending_review' | 'approved' | 'emailed' | 'escalated_to_senior' | 'resolved' | 'escalated'
  urgency: 'low' | 'medium' | 'high'
  route: 'auto_reply' | 'web_search' | 'escalate' | null
  confidence_score: number | null
  created_at: string
  subject?: string
  customer_name?: string
  customer_email?: string | null
}

export interface TicketReview {
  ticket_id: string
  status: string
  urgency: string
  route: string | null
  confidence_score?: number | null
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  original_message: string
  ai_draft: string | null
  edited_reply: string | null
  final_sent_reply: string | null
  created_at: string
  assigned_to: string | null
}

export interface EscalationBrief {
  ticket_id: string
  urgency: string
  brief: string
  assigned_to: string | null
  created_at: string
}

export interface SubmitTicketInput {
  customer_name: string
  customer_email: string
  customer_phone?: string
  message: string
}

export interface SubmitTicketResponse {
  ticket_id: string
  message: string
}

export interface AgentLog {
  node_name: string
  decision: string
  confidence_score: number | null
  created_at: string | null
}

export interface TicketProgress {
  ticket_id: string
  status: string
  route_decision: string | null
  confidence_score: number | null
  logs: AgentLog[]
}

// ---- patient ----

export const submitTicket = (body: SubmitTicketInput) =>
  req<SubmitTicketResponse>('/ticket', { method: 'POST', body: JSON.stringify(body) })

export const getTicket = (id: string) => req<Ticket>(`/ticket/${id}`)

export const getTicketsByEmail = (email: string) =>
  req<Ticket[]>(`/tickets/by-email/${encodeURIComponent(email)}`)

export const getTicketProgress = (id: string) =>
  req<TicketProgress>(`/ticket/${id}/logs`)

// ---- review (admin) ----

export const getPendingReview = () => req<TicketReview[]>('/review/pending')

export const getTicketReview = (id: string) => req<TicketReview>(`/review/${id}`)

export const approveTicket = (id: string) =>
  req<{ message: string }>(`/review/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewed_by: 'ADMINNAVAJEEVANA' }),
  })

export const editTicket = (id: string, edited_reply: string) =>
  req<{ message: string }>(`/review/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify({ edited_reply, reviewed_by: 'ADMINNAVAJEEVANA' }),
  })

export const sendEmail = (id: string) =>
  fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket_id: id }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text().catch(() => r.statusText))
    return r.json() as Promise<{ message: string }>
  })

export const assignTicket = (id: string, assigned_to: string) =>
  req<{ message: string }>(`/review/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to }),
  })

// ---- all tickets ----

export const getAllTickets = () => req<Ticket[]>('/tickets/all')

export const getEscalationBrief = (id: string) =>
  req<EscalationBrief>(`/ticket/${id}/brief`)

export const resolveTicket = (id: string) =>
  req<{ message: string }>(`/ticket/${id}/resolve`, { method: 'PATCH' })

// ---- appointment types ----

export interface Doctor {
  id: string
  full_name: string
  specialization: string
  branch: string
  is_active: boolean
  working_days: string[]
}

export interface AppointmentSlot {
  slot_id: string
  slot_time: string
  label: string
  status: string
}

interface SlotsResponse {
  doctor_id: string
  doctor_name: string
  date: string
  slots: AppointmentSlot[]
  note?: string
}

export interface BookAppointmentPayload {
  patient_name: string
  patient_email: string
  patient_phone: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  slot_label: string
  slot_id: string
  reason: string
  came_before: boolean
  session_id: string
}

export interface AppointmentResult {
  appointment_id: string
  status: string
  message?: string
}

export interface Appointment {
  id: string
  patient_name: string
  patient_email: string
  patient_phone?: string
  doctor_id: string
  doctor_name?: string
  appointment_date: string
  appointment_time: string
  slot_label: string
  reason: string
  came_before: boolean
  status: string
  created_at: string
  updated_at?: string
}

// ---- appointment API ----

export const getDoctors = () => req<Doctor[]>('/doctors')

export const getAvailableSlots = (doctor_id: string, date: string) =>
  req<SlotsResponse>(`/appointment/slots/${doctor_id}?date=${date}`)
    .then(r => r.slots)

export const bookAppointment = (payload: BookAppointmentPayload) =>
  req<AppointmentResult>('/appointment/book', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getAppointmentById = (id: string) =>
  req<Appointment>(`/appointment/${id}`)

export const getAppointmentsByEmail = (email: string) =>
  req<Appointment[]>(`/appointment/by-email/${encodeURIComponent(email)}`)

export const getAllAppointments = () =>
  req<Appointment[]>('/appointment/all')

export const cancelAppointment = (id: string) =>
  req<{ appointment_id: string; status: string }>(`/appointment/${id}/cancel`, { method: 'PATCH' })

export const updateAppointmentAdminStatus = (id: string, status: string) =>
  req<{ appointment_id: string; status: string }>(`/appointment/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, performed_by: 'ADMINNAVAJEEVANA' }),
  })
