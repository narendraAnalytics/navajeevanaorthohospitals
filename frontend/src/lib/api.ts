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
  customer_email?: string
}

export interface TicketReview {
  ticket_id: string
  status: string
  urgency: string
  route: string | null
  customer_name: string
  customer_email: string
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
  req<{ message: string }>(`/review/${id}/approve`, { method: 'PATCH' })

export const editTicket = (id: string, edited_reply: string) =>
  req<{ message: string }>(`/review/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify({ edited_reply }),
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
