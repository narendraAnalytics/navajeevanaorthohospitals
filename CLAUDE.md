# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**OrthoAI** — AI-powered patient support + appointment booking system for Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh, India.

Stack: FastAPI + LangGraph (two independent StateGraphs) + ChromaDB RAG + Neon PostgreSQL + Groq LLM + Next.js 16 frontend.

Source layout: `backend/` (Python API + agents), `frontend/` (Next.js), `render.yaml` (backend deploy), `vercel.json` (frontend deploy).

## Commands

**Backend** — run from `backend/` with `.venv` activated:

```powershell
.venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

python -m pytest tests/ -v                              # offline unit tests (no Neon/Groq)
python -m pytest tests/test_routes.py -v
python -m pytest tests/test_safety_checker.py::test_medication_triggers_escalation -v
python -m pytest tests/test_graph_integration.py -v -s  # end-to-end (real Groq API calls)

python scripts/seed_knowledge_base.py   # load/reload all KB docs into ChromaDB
python scripts/seed_doctors.py          # seed 8 doctors + schedules from doctors_directory.md
python scripts/generate_slots.py        # generate fixed 4 slots/day per doctor for next 30 days

uv add <package>
ruff check app/
black --check app/
```

Test files: `tests/test_config.py`, `test_routes.py`, `test_safety_checker.py`, `test_graph_integration.py`, `test_groq_langgraph.py`, `test_memory_integration.py` (+ `conftest.py`).

**Frontend** — run from `frontend/`:

```powershell
npm run dev        # dev server on :3000
npm run build      # production build check
npm run db:push    # push schema changes to Neon (creates/alters frontend_users table ONLY)
npm run db:studio  # Drizzle Studio — browse frontend_users table in browser
```

> **`db:push` warning:** `drizzle.config.ts` has `tablesFilter: ['frontend_users']`. Without this, drizzle-kit sees ALL tables in the shared Neon DB (including backend's `tickets`, `checkpoints`, etc.) and offers to drop them. Never remove the filter.

## Backend Architecture

Two independent LangGraph StateGraphs coexist in the same FastAPI process, both compiled in `main.py` lifespan and stored on `app.state`.

### Ticketing Graph (`app.state.graph`)

**8-node LangGraph StateGraph** — ticket flows through agents in two phases:

```
[Orchestrator] → fan-out (parallel):
    [Intent Classifier]  [Safety Checker]  [RAG Retriever]
→ fan-in → [Confidence Evaluator] → 3 routes:
    ├── auto_reply  → [Reply Writer]            (RAG score ≥ 0.65, no safety flags)
    ├── web_search  → [Tavily] → [Reply Writer] (RAG score < 0.65, Tavily ≥ 0.50)
    └── escalate    → [Escalation Packager]     (any safety flag OR Tavily < 0.50)
→ [Memory Manager] → Human Review Queue
```

Agent source files: `backend/app/agent/nodes/` (one file per node). Graph wiring: `backend/app/agent/graph.py`. Routing conditions: `backend/app/agent/edges.py`. State: `backend/app/agent/state.py`.

- **Safety Checker** is keyword-only (no LLM). Never convert to LLM-based.
- **Tavily** is a tool node — no LLM call inside it.
- `orchestrator` and `memory_manager` are `async` and inject `AsyncPostgresStore` as a second parameter — LangGraph injects the store automatically when the graph is compiled with `store=store`.
- **Graph is streamed, not invoked**: `_run_graph` in `tickets.py` uses `graph.astream(stream_mode="updates")`. After the stream, `graph.aget_state(config)` reads the final state. Do not revert to `ainvoke`.
- `TicketState` uses `Annotated[List[dict], operator.add]` on `classifications`, `safety_flags`, `rag_results` so parallel agents can write without overwriting.
- Confidence Evaluator registered as `"confidence_eval"` in the graph but its `node_name` in `agent_logs` is `"confidence_evaluator"` — keep in sync if renaming.

### Appointment Graph (`app.state.appointment_graph`)

**Sequential LangGraph StateGraph** — no fan-out (all DB operations must happen in order):

```
[Booking Orchestrator]  ← pure Python; validates fields; loads patient history if came_before=True
→ [Slot Validator]       ← date rules + fixed 4 times only (no LLM/DB)
→ [Availability Checker] ← DB query
→ conditional on availability_result:
    "available" → [Slot Hold Agent]   ← UPDATE slot to 'held' (5-min TTL)
    "taken"     → [Alternative Suggester] → END
    "invalid"   → [Error Packager] → END
→ conditional on hold_result:
    "held"   → [Slot Reservation Agent] ← INSERT appointments row
    "failed" → [Alternative Suggester] → END
→ [Notification Agent]  ← Resend email via httpx
→ [Audit Logger]        ← INSERT appointment_audit_logs
→ [Memory Updater]      ← write to AsyncPostgresStore
→ END
```

Agent source files: `backend/app/agent/appointment_nodes/` (one file per node). Graph: `backend/app/agent/appointment_graph.py`. State: `backend/app/agent/appointment_state.py`.

- `booking_orchestrator` and `memory_updater` are `async` and receive `store: BaseStore` as a second parameter.
- All DB-hitting nodes (`availability_checker`, `slot_hold_agent`, etc.) call `await get_pool()` from `app.database.connection` — safe because the singleton is initialised before the graph runs.
- **Conversation (Q1/Q2/Q3) is separate from the graph.** `POST /appointment/conversation/{session_id}` handles the step-by-step widget statelessly (each call processes one answer and returns the next question). The full graph runs only when `POST /appointment/book` is called with all answers collected.
- Fixed 4 slots per working day: `09:00` (Morning 1), `10:30` (Morning 2), `14:00` (Evening 1), `15:30` (Evening 2). `slot_validator` rejects any other times.
- `appointment_queries.py` is a **separate file** from `queries.py` — never merge them. Ticketing queries live in `queries.py`; appointment queries in `appointment_queries.py`.

## FastAPI Lifespan (critical)

`main.py` uses nested `async with` to own the checkpointer/store lifecycle:

```python
async with checkpointer_cm() as checkpointer:
    await checkpointer.setup()
    async with store_cm() as store:
        await store.setup()
        app.state.graph = build_graph(checkpointer=checkpointer, store=store)
        app.state.appointment_graph = build_appointment_graph(checkpointer=checkpointer, store=store)
        yield
```

Never return early from inside these context managers — closes connections immediately. All routers access pool and graphs via `request.app.state.*`.

**Test fixture:** tests bypass lifespan. Set `app.state.pool`, `app.state.graph`, and `app.state.appointment_graph` on the app directly before creating the `AsyncClient`.

## LLM Tiers

`app/llm_factory.py` returns `(llm_pro, llm_flash, llm_lite)`:
- `llm_pro` = `llama-3.3-70b-versatile` — Escalation Packager only
- `llm_flash` = `llama-3.1-8b-instant` — Orchestrator, Intent Classifier, RAG Retriever, Reply Writer, Alternative Suggester, Error Packager
- `llm_lite` = `llama-3.1-8b-instant` — Memory Manager

Nodes import `ChatGroq` directly with `settings.GROQ_API_KEY` — do not use `llm_factory` in appointment nodes; instantiate inline following the same pattern as `orchestrator.py`.

## Database

Neon PostgreSQL (project `navajeevanaorthohospitals`, ID `autumn-tree-81633917`). Tables created via Neon MCP (`mcp__neon__run_sql`), not migration scripts.

### Ticketing tables

| Table | Purpose |
|---|---|
| `tickets` | One row per ticket — `customer_name`, `customer_email`, `customer_phone`, `reviewed_by`, status, urgency, route, confidence_score |
| `replies` | All versions: `ai_draft` → `edited_reply` → `final_sent_reply` |
| `escalations` | Staff brief + `assigned_to` |
| `agent_logs` | Per-node decisions written in real time during graph streaming |

Ticket lifecycle: `processing → pending_review → approved → emailed` (or `escalated_to_senior` / `resolved`).

`customer_id` = patient's email address. `subject` = first 60 chars of message. Both derived server-side.

### Appointment tables

| Table | Purpose |
|---|---|
| `doctors` | `id` (slug, e.g. `dr_arjun_reddy`), `full_name`, `specialization`, `branch`, `is_active` |
| `doctor_schedules` | Working days per doctor (`day_of_week` TEXT: `'Mon'`…`'Sat'`) |
| `doctor_unavailability` | Leave calendar — slot generator and availability checker skip these dates |
| `hospital_holidays` | Hospital-wide holidays — slots not generated on these dates |
| `appointment_slots` | Fixed 4 slots per working day per doctor; `label TEXT NOT NULL` (`'Morning 1'` etc.); `status`: `available \| held \| booked`; `held_until TIMESTAMPTZ` for 5-min TTL |
| `appointments` | `came_before BOOLEAN`, `slot_label TEXT`, `reason TEXT`; status lifecycle: `pending → confirmed → rescheduled \| completed \| cancelled \| no_show` |
| `appointment_audit_logs` | Every status change — `action`, `performed_by`, `metadata JSONB` |

`generate_slots.py` must be re-run (or triggered via deploy) periodically to extend the 30-day booking window. The script is idempotent (`ON CONFLICT DO NOTHING`).

### Shared memory

Both graphs share the same `AsyncPostgresStore` keyed by patient email:
- Ticketing graph writes `"medical_history"` → `("patient", email)`
- Appointment graph reads/writes `"appointment_history"` → `("patient", email)`
- Ticketing orchestrator can read `appointment_history` to personalise responses.

### Frontend-owned table

`frontend_users` — managed by Drizzle, not backend. Schema in `frontend/src/db/schema.ts`. Created via `npm run db:push`.

## Review API Field Names (critical)

SQL queries in `get_pending_review_tickets` and `get_ticket_review_detail` (`queries.py`) alias DB column names to frontend-aligned names:

| DB column | API field |
|---|---|
| `t.id` | `ticket_id` |
| `final_status` | `status` |
| `route_decision` | `route` |
| `raw_text` | `original_message` |

Router logic that checks `row["final_status"]` uses the raw dict before Pydantic serialization — keep `t.final_status` in SELECT alongside `t.final_status AS status`.

`get_ticket_review_detail` has three reply joins: `ai_draft`, `edited_reply`, `final_sent_reply`. `/api/send-email` priority: `final_sent_reply ?? edited_reply ?? ai_draft`.

## API Endpoints

### Ticketing

```
POST  /ticket                       -- submit ticket (202, graph runs in background)
GET   /ticket/{id}                  -- poll result
GET   /ticket/{id}/logs             -- agent execution logs (poll while processing)
GET   /tickets/by-email/{email}     -- all tickets for a patient email

GET   /review/pending               -- HITL review queue
GET   /review/{ticket_id}           -- full ticket + AI draft
PATCH /review/{ticket_id}/approve
PATCH /review/{ticket_id}/edit
POST  /review/{ticket_id}/send-email
PATCH /review/{ticket_id}/assign

GET   /tickets/all
GET   /ticket/{id}/brief            -- escalation brief
PATCH /ticket/{id}/resolve
```

### Appointment Booking

```
GET   /doctors                                    -- all active doctors with schedule summary
GET   /appointment/slots/{doctor_id}?date=...     -- 4 fixed labeled slots for a doctor+date
POST  /appointment/conversation/{session_id}      -- stateless Q&A step (stage 0/1/2 → next question)
POST  /appointment/book                           -- submit booking (202, graph runs in background)
GET   /appointment/{id}                           -- poll booking result
GET   /appointment/by-email/{email}               -- all appointments for patient
GET   /appointment/all                            -- admin: all appointments
PATCH /appointment/{id}/cancel
PATCH /appointment/{id}/reschedule                -- body: { new_slot_id }
PATCH /appointment/{id}/status                    -- admin: completed | no_show | confirmed | cancelled
```

**Conversation protocol** (stateless — frontend accumulates answers):
- `stage 0` answer = `slot_id` → validates slot exists/available, returns Q2 (reason textarea)
- `stage 1` answer = reason text → returns Q3 (came_before yes/no)
- `stage 2` answer = `"yes"` / `"no"` → returns `{complete: true, stage: 3}`

**`POST /appointment/book` body:**
```json
{ "patient_name": "...", "patient_email": "...", "patient_phone": "...",
  "doctor_id": "dr_arjun_reddy", "appointment_date": "2026-06-15",
  "appointment_time": "09:00", "slot_label": "Morning 1", "slot_id": "uuid",
  "reason": "knee pain", "came_before": true, "session_id": "conv_abc" }
```

## Knowledge Base

9 `.md` docs in `backend/app/knowledge_base/docs/`, each maps to a ChromaDB collection. To add a doc: create `.md` → add to `COLLECTION_MAP` in `loader.py` → add name to `COLLECTIONS` in `rag_retriever.py` → re-run seed script. ChromaDB chunks on `## ` / `### ` headings.

## Environment Variables

**Backend** (Render dashboard or `.env`):
```
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
NEON_DB_URL=postgresql://...
CHROMA_MODE=local
ALLOWED_ORIGIN=https://navajeevanaorthohospitals.vercel.app
APP_ENV=development
RESEND_API_KEY=re_...        # appointment confirmation emails
RESEND_FROM_EMAIL=admin@...  # verified Resend sender
RESEND_FROM_NAME=Navajeevana Ortho Hospitals
```

**Frontend** (Vercel dashboard; locally `frontend/.env`):
```
NEXT_PUBLIC_API_URL=https://navajeevanaorthohospitals.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/api/auth/sync
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/api/auth/sync
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/
DATABASE_URL=postgresql://...   # direct Neon URL (no pooler) — for frontend_users Drizzle
RESEND_API_KEY=re_...           # server-side only — ticket /api/send-email route
RESEND_FROM_EMAIL=admin@...
RESEND_FROM_NAME=NAVAJEEVANAORTHO
```

`DATABASE_URL` must be the direct Neon connection string (no `-pooler`). `neon-http` Drizzle driver uses fetch, not WebSockets.

`NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` are deprecated in Clerk v7 — use `FORCE_REDIRECT_URL` variants only.

## Frontend Architecture

Stack: Next.js 16 + React 19 + Tailwind 4 + Shadcn (`@base-ui/react`).

**Route structure:**

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | ✅ Landing page (server component) |
| `/patient/intro` | `src/app/patient/intro/page.tsx` | ✅ Entry animation → `/patient` |
| `/patient` | `src/app/patient/page.tsx` | ✅ Care Hub — submit ticket + track |
| `/patient/submit-transition/[ticket_id]` | `src/app/patient/submit-transition/[ticket_id]/page.tsx` | ✅ AI handoff animation |
| `/patient/processing/[ticket_id]` | `src/app/patient/processing/[ticket_id]/page.tsx` | ✅ Live pipeline view |
| `/admin/login` | `src/app/admin/login/page.tsx` | ✅ SessionStorage auth |
| `/admin` | `src/app/admin/page.tsx` | ✅ Admin home |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | ✅ HITL review + Overview |
| `/doctors` | `src/app/doctors/page.tsx` | ✅ Doctor cards grid + booking modal |
| `/patient/book` | *(pending Phase B2)* | ⬜ 3-step booking form |
| `/patient/book/confirm/[id]` | *(pending Phase B3)* | ⬜ Booking confirmation |
| `/patient/appointments` | *(pending Phase B4)* | ⬜ My appointments list |

**Key files:**

| File | Purpose |
|---|---|
| `src/app/globals.css` | All brand CSS — design tokens + every landing page class |
| `src/app/layout.tsx` | Sora + Plus Jakarta Sans fonts; `<ClerkProvider>` inside `<body>` |
| `src/proxy.ts` | Clerk middleware — MUST be named `proxy.ts`. `/admin(.*)` excluded (sessionStorage auth). Also excludes `/api/send-email`. |
| `src/lib/api.ts` | Typed fetch wrapper for all backend endpoints. `sendEmail()` posts to `/api/send-email` (Next.js route), not backend directly. |
| `src/lib/auth.ts` | `getOrCreateUser()` — lazy Clerk→Neon sync for `frontend_users` |

**Design system:**
- Brand CSS vars prefixed: `--bk-muted`, `--brand-maxw` (avoids Tailwind 4 / Shadcn conflicts)
- Landing page: `className="brand-page"` — sets fonts + ivory `#FFFBF7` background
- Tailwind for `/admin` and `/patient`; inline `<style>` for transition/animation pages and `/doctors`
- Animation pages + `/doctors` background: ivory + three floating orbs (mint `#9DF0D6`, peach `#FFD0BB`) + optional dot-grid
- Never put a changing `key` on `<img>` in the hero carousel — CSS `opacity` handles crossfade
- All `<label>` must have `htmlFor`; standalone inputs need `aria-label`; label style: `.pt-label`

**`/doctors` page architecture (important):**
- Doctor data is **static** in `src/app/doctors/page.tsx` — 8 doctors hardcoded with Cloudinary image URLs from `frontend/bookingappt.txt`. The page does NOT call `GET /doctors` to render cards; static data avoids a cold-start round-trip.
- The in-page `BookingModal` does call the live backend: `getAvailableSlots(doctor_id, date)` on date change, then `bookAppointment()` on submit.
- HeroSection "Book Appointment" CTA (signed-in users) routes to `/doctors` (not `/patient/intro`). Signed-out users still see a Clerk `<SignInButton>` redirecting to `/patient`.
- CSS classes use `dp-` prefix (page/filter) and `dc-` prefix (doctor card) and `bm-` prefix (booking modal) to avoid collision with globals.

## Clerk Auth

- Middleware: `src/proxy.ts` (not `middleware.ts` — project convention)
- Use `<Show when="signed-in">` / `<Show when="signed-out">` — not deprecated `<SignedIn>` / `<SignedOut>`
- `<SignInButton>`: use `forceRedirectUrl` prop (not deprecated `redirectUrl`)
- `<UserButton />`: no props needed; `afterSignOutUrl` prop does not exist in Clerk v7
- Patient email: auto-filled from `useUser()` and locked (`readOnly`) — never let patients change it
- Admin portal: sessionStorage-based, not Clerk. Username `ADMINNAVAJEEVANA` / password `admin@123`

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend (FastAPI) | Render | https://navajeevanaorthohospitals.onrender.com |
| Frontend (Next.js) | Vercel | https://navajeevanaorthohospitals.vercel.app |

**Render build command** (in `render.yaml`):
```
pip install -r requirements.txt && python scripts/seed_knowledge_base.py && python scripts/seed_doctors.py && python scripts/generate_slots.py
```
All scripts are idempotent — safe to re-run on every deploy.

> **CORS critical:** `ALLOWED_ORIGIN` in Render env vars **must** be `https://navajeevanaorthohospitals.vercel.app`. Default in `config.py` is `http://localhost:3000`.

> **Neon cold-start:** Render free tier sleeps after ~15 min. If graph fails with `AdminShutdown`, restart the backend service.

> `GET /` returns `{"detail":"Not Found"}` — normal. Use `/docs` for Swagger UI.

**Vercel:** Root directory = `frontend` (set in dashboard, not in `vercel.json`). Env var changes require manual redeploy.

## Build Progress

| Phase | Status |
|---|---|
| Phase 1–6 — Backend foundation, KB, agents, graph, HITL, Render deploy | ✅ |
| Phase 7 — Full Next.js frontend (landing, auth, patient portal, admin dashboard) | ✅ |
| Phase 8 — Bug fixes + hardening (field aliases, CORS, confidence threshold) | ✅ |
| Phase A — Appointment backend (7 tables, 8 doctors, slot generator, 10 nodes, graph, router) | ✅ |
| Phase B0 — `/doctors` page + landing CTA update | ✅ |
| Phase B1 — Appointment types + API functions in `api.ts` | ✅ |
| Phase B2 — `/patient/book` 3-step form (doctor+date → details → agent widget Q1/Q2/Q3) | ⬜ |
| Phase B3 — `/patient/book/confirm/[id]` polling + confirmation card | ⬜ |
| Phase B4 — `/patient/appointments` list with status badges + cancel | ⬜ |
| Phase B5 — Care Hub pill nav: Book Appt → `/doctors`, My Appts | ⬜ |
| Phase B6 — Appointments tab in admin dashboard | ⬜ |
