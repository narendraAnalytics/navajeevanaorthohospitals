# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**OrthoAI** — AI-powered patient support agent for Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh, India.

Stack: FastAPI + LangGraph (8-agent graph) + ChromaDB RAG + Neon PostgreSQL + Groq LLM + Next.js 16 frontend.

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

uv add <package>
ruff check app/
black --check app/
```

**Frontend** — run from `frontend/`:

```powershell
npm run dev        # dev server on :3000
npm run build      # production build check
npm run db:push    # push schema changes to Neon (creates/alters frontend_users table ONLY)
npm run db:studio  # Drizzle Studio — browse frontend_users table in browser
```

> **`db:push` warning:** `drizzle.config.ts` has `tablesFilter: ['frontend_users']`. Without this, drizzle-kit sees ALL tables in the shared Neon DB (including backend's `tickets`, `checkpoints`, etc.) and offers to drop them. Never remove the filter.

## Backend Architecture

**8-node LangGraph StateGraph** — ticket flows through agents in two phases:

```
[Orchestrator] → fan-out (parallel):
    [Intent Classifier]  [Safety Checker]  [RAG Retriever]
→ fan-in → [Confidence Evaluator] → 3 routes:
    ├── auto_reply  → [Reply Writer]          (RAG score ≥ 0.70, no safety flags)
    ├── web_search  → [Tavily] → [Reply Writer] (RAG score < 0.70, Tavily ≥ 0.50)
    └── escalate    → [Escalation Packager]   (any safety flag OR Tavily < 0.50)
→ [Memory Manager] → Human Review Queue
```

- **Safety Checker** is keyword-only (no LLM). Never convert to LLM-based.
- **Tavily** is a tool node — no LLM call inside it.
- `orchestrator` and `memory_manager` are `async` (inject `AsyncPostgresStore`). Never use `graph.invoke()` — synchronous invocation fails on async nodes.
- **Graph is streamed, not invoked**: `_run_graph` in `tickets.py` uses `graph.astream(stream_mode="updates")` so each node's output dict is captured as it completes. After the stream, `graph.aget_state(config)` reads the final accumulated state from the checkpointer. This is what writes `agent_logs` rows in real time — do not revert to `ainvoke`.
- `TicketState` uses `Annotated[List[dict], operator.add]` on `classifications`, `safety_flags`, `rag_results` so parallel agents can write without overwriting.

## LLM Tiers

`app/llm_factory.py` returns `(llm_pro, llm_flash, llm_lite)`:
- `llm_pro` = `llama-3.3-70b-versatile` — Escalation Packager only
- `llm_flash` = `llama-3.1-8b-instant` — Orchestrator, Intent Classifier, RAG Retriever, Reply Writer
- `llm_lite` = `llama-3.1-8b-instant` — Memory Manager

## Reply Behavior

| Route | Trigger | `reply_text` opens with |
|---|---|---|
| `auto_reply` | RAG ≥ 0.70, no flags | "At Navajeevana Ortho Hospitals, ..." |
| `web_reply` | RAG < 0.70, Tavily ≥ 0.50 | "[Web Search Result] The following is general information sourced from the web..." |
| `escalate` | Safety flag OR Tavily < 0.50 | Urgency-aware patient acknowledgment; full brief goes to staff |

## Knowledge Base

9 `.md` docs in `backend/app/knowledge_base/docs/`, each maps to a ChromaDB collection:

| File | Collection |
|---|---|
| `appointment_faq.md` | `appointment_faq` |
| `doctors_directory.md` | `doctors_directory` |
| `escalation_rules.md` | `escalation_rules` |
| `hospital_information.md` | `hospital_information` |
| `insurance_billing.md` | `insurance_billing` |
| `past_tickets.md` | `past_tickets` |
| `physiotherapy_rehabilitation.md` | `physiotherapy_rehabilitation` |
| `post_surgery_care.md` | `post_surgery_care` |
| `test_preparation.md` | `test_preparation` |

To add a new doc: create the `.md` → add to `COLLECTION_MAP` in `loader.py` → add collection name to `COLLECTIONS` in `rag_retriever.py` → re-run seed script.

ChromaDB chunks on `## ` / `### ` headings. Cosine similarity space.

## FastAPI Lifespan (critical)

`main.py` uses nested `async with` to own the checkpointer/store lifecycle for the full app lifetime. Never return early from inside these context managers — connection closes immediately. All routers access pool and graph via `request.app.state.pool` and `request.app.state.graph`.

## Database

Neon PostgreSQL (project `navajeevanaorthohospitals`, ID `autumn-tree-81633917`). Tables created via Neon MCP (`mcp__neon__run_sql`), not migration scripts.

| Table | Purpose |
|---|---|
| `tickets` | One row per ticket — `customer_name`, `customer_email`, `customer_phone`, `reviewed_by`, status, urgency, route, confidence_score |
| `replies` | All versions: `ai_draft` → `edited_reply` → `final_sent_reply` |
| `escalations` | Staff brief + `assigned_to` |
| `agent_logs` | Per-node decisions written in real time during graph streaming — `node_name`, `decision`, `confidence_score`, `created_at` |

Ticket lifecycle: `processing → pending_review → approved → emailed` (or `escalated_to_senior` / `resolved`).

Short-term memory = `AsyncPostgresSaver` per `ticket_id`. Long-term memory = `AsyncPostgresStore` per `customer_id`.

**`customer_id` = patient's email address** — derived in the route handler from `body.customer_email`. This ensures all tickets from the same patient share long-term memory in AsyncPostgresStore. `subject` is auto-derived from the first 60 chars of the message.

**Frontend-owned table** (managed by Drizzle, not backend):

| Table | Purpose |
|---|---|
| `frontend_users` | Clerk user sync — `id` (text, Clerk user_xxx), `email`, `full_name`, `avatar_url` |

Created via `npm run db:push` from `frontend/`. Schema in `frontend/src/db/schema.ts`.

## API Endpoints

```
POST  /ticket                       -- submit ticket (202, graph runs in background)
GET   /ticket/{id}                  -- poll result
GET   /ticket/{id}/logs             -- agent execution logs for live pipeline view (poll while processing)
GET   /tickets/by-email/{email}     -- all tickets for a patient email, newest first

GET   /review/pending               -- tickets awaiting HITL review
GET   /review/{ticket_id}           -- full ticket + AI draft
PATCH /review/{ticket_id}/approve
PATCH /review/{ticket_id}/edit
POST  /review/{ticket_id}/send-email
PATCH /review/{ticket_id}/assign

GET   /tickets/all
GET   /ticket/{id}/brief            -- escalation brief
PATCH /ticket/{id}/resolve
```

**`POST /ticket` request body** (matches `SubmitTicketInput` on frontend):
```json
{ "customer_name": "...", "customer_email": "...", "customer_phone": "...", "message": "..." }
```
`customer_id` and `subject` are derived server-side — never sent by the client.

## Environment Variables

**Backend** (set in Render dashboard or `.env`):
```
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
NEON_DB_URL=postgresql://...
CHROMA_MODE=local           # local | server
CHROMA_HOST=localhost       # server mode only
CHROMA_PORT=8001            # server mode only
ALLOWED_ORIGIN=https://navajeevanaorthohospitals.vercel.app
APP_ENV=development
```

**Frontend** (set in Vercel dashboard; locally in `frontend/.env` — gitignored, never commit secrets):
```
NEXT_PUBLIC_API_URL=https://navajeevanaorthohospitals.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/api/auth/sync
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/api/auth/sync
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/
DATABASE_URL=postgresql://...  # direct Neon URL (no -pooler, no channel_binding) — for frontend user sync
RESEND_API_KEY=re_...           # server-side only (no NEXT_PUBLIC_ prefix) — used by /api/send-email route
RESEND_FROM_EMAIL=admin@...     # verified sender domain on Resend
RESEND_FROM_NAME=NAVAJEEVANAORTHO
```
Note: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` are **deprecated in Clerk v7** — use `FORCE_REDIRECT_URL` variants only.

`DATABASE_URL` must be the **direct** Neon connection string — not the pooler URL. The `neon-http` Drizzle driver uses fetch, not WebSockets; pooler URL causes query failures.

## Frontend Architecture

All frontend code lives in `frontend/`. Stack: Next.js 16 + React 19 + Tailwind 4 + Shadcn (`@base-ui/react`).

**Route structure:**

| Route | Purpose |
|---|---|
| `/` | Landing page — server component, imports client section components |
| `/patient` | Patient portal — submit ticket + track by ID or email |
| `/patient/processing/[ticket_id]` | Live agent pipeline visualization — polls `/ticket/{id}/logs` every 1.5 s, animates 8 nodes waiting→running→done, shows completion card |
| `/admin` | Admin dashboard — HITL review queue, approve/edit/send email |
| `/api/send-email` | Server-side Next.js route — sends HTML email via Resend, then marks backend ticket as `emailed` |
| `/api/auth/sync` | Clerk post-login hook — syncs user to `frontend_users` via `getOrCreateUser()` |

**Key files:**

| File | Purpose |
|---|---|
| `frontend/src/app/globals.css` | All brand CSS — design tokens (CSS vars) + every landing page class |
| `frontend/src/app/layout.tsx` | Sora + Plus Jakarta Sans fonts; `<ClerkProvider>` inside `<body>`; favicon via `metadata.icons` |
| `frontend/src/proxy.ts` | Clerk middleware — protects `/patient` and `/admin`; public routes: `/`, `/sign-in`, `/sign-up`, `/api/auth/sync` |
| `frontend/src/app/api/auth/sync/route.ts` | Calls `getOrCreateUser()` then redirects to `/` — Clerk redirects here after sign-in/up |
| `frontend/src/lib/api.ts` | Typed fetch wrapper for all backend endpoints. `sendEmail()` posts to `/api/send-email` (Next.js route), not the backend directly. |
| `frontend/src/lib/auth.ts` | `getOrCreateUser()` — lazy Clerk→Neon sync; creates `frontend_users` row on first login |
| `frontend/src/db/schema.ts` | Drizzle schema for `frontend_users` (Clerk user ID, email, full_name, avatar_url) |
| `frontend/src/db/index.ts` | Neon HTTP client + Drizzle instance (`drizzle-orm/neon-http`) |
| `frontend/src/components/Nav.tsx` | Glassmorphic nav — auth-aware: shows `Welcome [name]` + `<UserButton>` when signed in, hides Admin Portal |
| `frontend/src/components/HeroSection.tsx` | 4-slide carousel + CTA buttons gated with `<SignInButton>` when signed out |
| `frontend/src/components/RevealObserver.tsx` | IntersectionObserver — adds `.in` to `.reveal` elements on scroll; rendered once in `page.tsx` (client) |
| `frontend/src/components/TestimonialsSection.tsx` | Testimonial carousel + AI feature card (client) |
| `frontend/src/components/Footer.tsx` | 4-column dark footer (server) |

**Design system notes:**
- Brand CSS variables prefixed to avoid Tailwind 4 conflicts: `--bk-muted` (not `--muted`), `--brand-maxw` (not `--maxw`)
- Landing page wrapper uses `className="brand-page"` — sets Sora/Jakarta fonts and ivory background
- Tailwind is used for `/admin` and `/patient`; custom CSS classes for the landing page
- Hero uses a 4-slide Cloudinary carousel (URLs in `images.txt` at project root). `next.config.ts` whitelists `res.cloudinary.com` in `images.remotePatterns`.
- `.reveal` elements start `opacity:0` and animate in via `RevealObserver.tsx`. Must render `<RevealObserver />` in any page that uses `.reveal`.
- **Hero carousel pitfall:** never put a changing `key` on the `<img>` elements — it forces React to remount them on every slide change, causing flickers and stalls. CSS `opacity` transition on `.hero-slide.active` handles crossfade; images stay in DOM permanently.
- **No inline styles in `page.tsx`:** dynamic gradient/background values are expressed as CSS classes (`bg-gi-teal`, `bg-gi-warm`, `bg-gi-violet`, `bg-gi-coral`, `bg-sc-*`) defined in `globals.css`. Data arrays hold class name strings, not style values.
- **Form accessibility:** all `<label>` elements must have `htmlFor` linked to the input's `id`. Standalone inputs (e.g. track input) need `aria-label`. Label styling uses `.pt-label` CSS class — not inline style.

## Clerk Auth (frontend)

Clerk app ID: `app_3Eg6FM0HTdOA2XbRdiouZPemsef`. Auth is wired end-to-end:

- **Middleware:** `src/proxy.ts` — this is the correct path for Next.js 16 with `src/` layout. File MUST be named `proxy.ts` per project convention (standard `middleware.ts` also works if needed).
- **Components:** use `<Show when="signed-in">` / `<Show when="signed-out">` — never deprecated `<SignedIn>` / `<SignedOut>`
- **`<UserButton />`** — no props needed; sign-out redirect handled by `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` env var. `afterSignOutUrl` prop does not exist in Clerk v7.
- **`<SignInButton>`** — use `forceRedirectUrl` prop, not `redirectUrl` (deprecated).
- **Nav behavior:** signed-out → Patient Portal triggers sign-in + Admin Portal visible. Signed-in → Welcome [name] + UserButton (profile pic/sign-out dropdown) + Admin Portal hidden. "Patient Portal" label is a non-clickable `<span>` when signed in (not a link).
- **CTA buttons** in `HeroSection.tsx`: "Book Appointment" and "Ask Our Care Team" are wrapped in `<SignInButton>` when signed out; both navigate to `/patient` when signed in.
- **Patient portal form:** email auto-filled from Clerk and locked (`readOnly`, `cursor: not-allowed`); full name pre-filled but editable. Uses `useUser()` + `useEffect` to populate after Clerk loads. Tickets are tracked by email address.
- **Patient portal track tab:** mode toggle "By Ticket ID" / "By Email". Email mode pre-fills locked Clerk email and calls `GET /tickets/by-email/{email}`; shows a clickable list of all past tickets. ID mode unchanged. `getTicketsByEmail()` in `api.ts`.
- **Submit flow:** after `POST /ticket` succeeds, the patient portal redirects to `/patient/processing/{ticket_id}` — not an inline success card. The processing page polls `GET /ticket/{id}/logs` and animates each of the 8 agents as they complete.

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend (FastAPI) | Render | https://navajeevanaorthohospitals.onrender.com |
| Frontend (Next.js) | Vercel | https://navajeevanaorthohospitals.vercel.app |

**Backend (Render):** config in `render.yaml`. Uses `runtime: python` (not `env:`). Root dir = `backend`. Push to `main` → auto-deploy. Seed script runs on every build (upsert is idempotent).

**Frontend (Vercel):** config in `vercel.json` (`{"framework": "nextjs"}`). Root directory set to `frontend` in Vercel dashboard. Push to `main` → auto-deploy. `rootDirectory` is a dashboard setting — do not add it to `vercel.json` (causes validation error).

## Build Progress

| Phase | Status |
|---|---|
| Phase 1 — Foundation (config, state, models, safety checker) | ✅ |
| Phase 2 — Knowledge Base (ChromaDB, 9 docs, loader, seed) | ✅ |
| Phase 3 — LangGraph Agents (all 8 nodes) | ✅ |
| Phase 4 — Graph Wiring + Memory (PostgresSaver, AsyncPostgresStore) | ✅ |
| Phase 4.5 — HITL Review router | ✅ |
| Phase 5 — FastAPI + routers + Swagger | ✅ |
| Phase 6 — Render + Vercel deployment | ✅ |
| Phase 7 — Next.js frontend: landing page | ✅ |
| Phase 7 — Next.js frontend: Clerk auth (sign-in/up, nav, CTA gates) | ✅ |
| Phase 7 — Next.js frontend: patient portal (submit + track) | ✅ |
| Phase 7 — Next.js frontend: Clerk→Neon user sync (frontend_users) | ✅ |
| Phase 7 — Next.js frontend: patient form auto-fill from Clerk | ✅ |
| Phase 7 — Next.js frontend: ticket→email link (customer_id = email, DB columns) | ✅ |
| Phase 7 — Next.js frontend: track by email (GET /tickets/by-email) | ✅ |
| Phase 7 — Next.js frontend: admin dashboard (HITL review, approve/edit/send) | ✅ |
| Phase 7 — Next.js frontend: live agent pipeline page (/patient/processing/[id]) | ✅ |
| Phase 7 — Next.js frontend: Resend email integration (/api/send-email route) | ✅ |
