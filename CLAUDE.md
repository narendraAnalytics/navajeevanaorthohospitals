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

**8-node LangGraph StateGraph** — ticket flows through agents in two phases:

```
[Orchestrator] → fan-out (parallel):
    [Intent Classifier]  [Safety Checker]  [RAG Retriever]
→ fan-in → [Confidence Evaluator] → 3 routes:
    ├── auto_reply  → [Reply Writer]            (RAG score ≥ 0.70, no safety flags)
    ├── web_search  → [Tavily] → [Reply Writer] (RAG score < 0.70, Tavily ≥ 0.50)
    └── escalate    → [Escalation Packager]     (any safety flag OR Tavily < 0.50)
→ [Memory Manager] → Human Review Queue
```

Agent source files live in `backend/app/agent/nodes/` (one file per node). Graph wiring is in `backend/app/agent/graph.py`; routing conditions in `backend/app/agent/edges.py`; state definition in `backend/app/agent/state.py`.

> **Graph node name:** the Confidence Evaluator is registered as `"confidence_eval"` in the graph but its `node_name` in `agent_logs` rows is `"confidence_evaluator"` — keep these in sync if renaming.

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
| `/patient/intro` | Branded entry animation — single ring-draw + teal checkmark badge + pills; auto-redirects to `/patient` after 4.15 s. Shown from hero CTAs when signed in. |
| `/patient` | **"Care Hub"** — submit ticket + track by ID or email. Floating pill nav (`position:fixed`, `border-radius:60px`). Background: ivory `#FFFBF7` + orbs + dot-grid. |
| `/patient/submit-transition/[ticket_id]` | AI handoff animation — dual counter-rotating SVG rings (coral outer, teal inner) + coral 🤖 badge + pills + progress bar; auto-redirects to `/patient/processing/[ticket_id]` after 3.85 s. Shown after successful form submission. |
| `/patient/processing/[ticket_id]` | Live agent pipeline — polls `GET /ticket/{id}/logs` every 1.5 s; animates 9 nodes waiting→running→done with per-agent colored rings; shows glassmorphic completion card when done. |
| `/admin/login` | Admin login gate — custom username/password auth (not Clerk). Username: `ADMINNAVAJEEVANA`, password: `admin@123`. Sets `sessionStorage.adminAuth = '1'` on success. |
| `/admin` | Admin home — branded landing page (portal intro, features, dashboard link, sign out). Guards itself: redirects to `/admin/login` if not authenticated. |
| `/admin/dashboard` | Admin dashboard — HITL review queue, approve/edit/send email. Guards itself: redirects to `/admin/login` if `sessionStorage.adminAuth !== '1'`. |
| `/api/send-email` | Server-side route — sends HTML email via Resend, marks ticket as `emailed` |
| `/api/auth/sync` | Clerk post-login hook — syncs user to `frontend_users` via `getOrCreateUser()` |

**Key files:**

| File | Purpose |
|---|---|
| `frontend/src/app/globals.css` | All brand CSS — design tokens (CSS vars) + every landing page class |
| `frontend/src/app/layout.tsx` | Sora + Plus Jakarta Sans fonts; `<ClerkProvider>` inside `<body>`; favicon via `metadata.icons` |
| `frontend/src/proxy.ts` | Clerk middleware — protects all routes except `/`, `/sign-in`, `/sign-up`, `/api/auth/sync`, `/admin(.*)`. Admin uses its own sessionStorage auth, not Clerk. |
| `frontend/src/app/api/auth/sync/route.ts` | Calls `getOrCreateUser()` then redirects to `/patient` — Clerk redirects here after sign-in/up |
| `frontend/src/lib/api.ts` | Typed fetch wrapper for all backend endpoints. `sendEmail()` posts to `/api/send-email` (Next.js route), not the backend directly. |
| `frontend/src/lib/auth.ts` | `getOrCreateUser()` — lazy Clerk→Neon sync; creates `frontend_users` row on first login |
| `frontend/src/db/schema.ts` | Drizzle schema for `frontend_users` |
| `frontend/src/db/index.ts` | Neon HTTP client + Drizzle instance (`drizzle-orm/neon-http`) |

**Design system notes:**
- Brand CSS variables prefixed to avoid Tailwind 4 conflicts: `--bk-muted` (not `--muted`), `--brand-maxw` (not `--maxw`)
- Landing page wrapper uses `className="brand-page"` — sets Sora/Jakarta fonts and ivory background
- Tailwind is used for `/admin` and `/patient`; custom CSS classes (inline `<style>`) for transition/animation pages
- All animation pages share the same background: ivory `#FFFBF7` + three floating orbs (mint `#9DF0D6`, peach `#FFC9A3`/`#FFD0BB`) + `radial-gradient` dot-grid `::after`
- Hero carousel pitfall: never put a changing `key` on `<img>` elements — CSS `opacity` transition on `.hero-slide.active` handles crossfade; images stay in DOM permanently
- **Form accessibility:** all `<label>` elements must have `htmlFor`. Standalone inputs need `aria-label`. Label styling uses `.pt-label` CSS class.

## Clerk Auth (frontend)

Clerk app ID: `app_3Eg6FM0HTdOA2XbRdiouZPemsef`. Auth is wired end-to-end:

- **Middleware:** `src/proxy.ts` — MUST be named `proxy.ts` per project convention (not `middleware.ts`). `/admin(.*)` is excluded from Clerk — admin has its own login at `/admin/login` (sessionStorage-based).
- **Components:** use `<Show when="signed-in">` / `<Show when="signed-out">` — never deprecated `<SignedIn>` / `<SignedOut>`
- **`<UserButton />`** — no props needed; sign-out redirect via `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL`. `afterSignOutUrl` prop does not exist in Clerk v7.
- **`<SignInButton>`** — use `forceRedirectUrl` prop, not `redirectUrl` (deprecated).
- **Patient portal form:** email auto-filled from Clerk and locked (`readOnly`); full name pre-filled but editable. Uses `useUser()` + `useEffect`.
- **Submit flow:** `POST /ticket` → redirect to `/patient/submit-transition/{ticket_id}` (AI handoff animation, ~3.85 s) → `/patient/processing/{ticket_id}` (live pipeline view).
- **Track tab:** mode toggle "By Ticket ID" / "By Email". Email mode pre-fills locked Clerk email and calls `GET /tickets/by-email/{email}`.

## Deployment

| Service | Platform | URL |
|---|---|---|
| Backend (FastAPI) | Render | https://navajeevanaorthohospitals.onrender.com |
| Frontend (Next.js) | Vercel | https://navajeevanaorthohospitals.vercel.app |

**Backend (Render):** config in `render.yaml`. Uses `runtime: python` (not `env:`). Root dir = `backend`. Push to `main` → auto-deploy. Seed script runs on every build (upsert is idempotent).

**Frontend (Vercel):** config in `vercel.json` (`{"framework": "nextjs"}`). Root directory set to `frontend` in Vercel dashboard — do not add `rootDirectory` to `vercel.json` (causes validation error).

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
| Phase 7 — Next.js frontend: patient portal intro transition (/patient/intro) | ✅ |
| Phase 7 — Next.js frontend: patient portal design enhancement (orbs, badge, grid, trust row) | ✅ |
| Phase 7 — Next.js frontend: patient portal floating pill nav + "Care Hub" rename | ✅ |
| Phase 7 — Next.js frontend: processing page redesign (colored rings, orbs, pill nav) | ✅ |
| Phase 7 — Next.js frontend: submit-transition page (/patient/submit-transition/[id]) | ✅ |
| Phase 7 — Next.js frontend: admin login gate (/admin/login, sessionStorage auth) | ✅ |
| Phase 7 — Next.js frontend: admin home landing page (/admin, portal intro + mockup) | ✅ |
