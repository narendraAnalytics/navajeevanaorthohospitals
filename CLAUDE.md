# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**OrthoAI** — AI-powered patient support agent for Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh, India.

Stack: FastAPI + LangGraph (8-agent graph) + ChromaDB RAG + Neon PostgreSQL + Groq LLM + Next.js 16 frontend.

Source layout: `backend/` (Python API + agents), `frontend/` (Next.js), `render.yaml` (deployment config).

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
npm run dev     # dev server on :3000
npm run build   # production build
```

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
- `orchestrator` and `memory_manager` are `async` (inject `AsyncPostgresStore`). Always use `graph.ainvoke()`, never `graph.invoke()`.
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
| `tickets` | One row per ticket — status, urgency, route, confidence_score |
| `replies` | All versions: `ai_draft` → `edited_reply` → `final_sent_reply` |
| `escalations` | Staff brief + `assigned_to` |
| `agent_logs` | Per-node JSONB decisions |

Ticket lifecycle: `processing → pending_review → approved → emailed` (or `escalated_to_senior` / `resolved`).

Short-term memory = `AsyncPostgresSaver` per `ticket_id`. Long-term memory = `AsyncPostgresStore` per `customer_id`.

## API Endpoints

```
POST  /ticket                       -- submit ticket (202, graph runs in background)
GET   /ticket/{id}                  -- poll result

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

## Environment Variables

```
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...
NEON_DB_URL=postgresql://...
CHROMA_MODE=local           # local | server
CHROMA_HOST=localhost       # server mode only
CHROMA_PORT=8001            # server mode only
ALLOWED_ORIGIN=http://localhost:3000
APP_ENV=development
```

## Frontend Architecture

All frontend code lives in `frontend/`. Stack: Next.js 16 + React 19 + Tailwind 4 + Shadcn (`@base-ui/react`).

**Route structure:**

| Route | Purpose |
|---|---|
| `/` | Landing page — server component, imports client section components |
| `/patient` | Patient portal — submit ticket, poll status with auto-refresh |
| `/admin` | Admin dashboard — HITL review queue, approve/edit/send email |

**Key files:**

| File | Purpose |
|---|---|
| `frontend/src/app/globals.css` | All brand CSS — design tokens (CSS vars) + every landing page class |
| `frontend/src/app/layout.tsx` | Sora + Plus Jakarta Sans fonts via `next/font/google` |
| `frontend/src/lib/api.ts` | Typed fetch wrapper for all backend endpoints |
| `frontend/src/components/Nav.tsx` | Glassmorphic nav — scroll shrink + section spy (client) |
| `frontend/src/components/HeroSection.tsx` | Full-width banner hero — `bannerimage.png` background, animated stat counters (client) |
| `frontend/src/components/TestimonialsSection.tsx` | Testimonial carousel + AI feature card (client) |
| `frontend/src/components/Footer.tsx` | 4-column dark footer (server) |

**Design system notes:**
- Brand CSS variables prefixed to avoid Tailwind 4 conflicts: `--bk-muted` (not `--muted`), `--brand-maxw` (not `--maxw`)
- Landing page wrapper uses `className="brand-page"` — sets Sora/Jakarta fonts and ivory background
- Tailwind is used for `/admin` and `/patient`; custom CSS classes for the landing page
- Hero uses `bannerimage.png` as full-width CSS background image; text overlays on left with ivory gradient fade
- API base URL: `NEXT_PUBLIC_API_URL` in `.env.local` (localhost:8000 in dev, Render URL in prod)

## Render Deployment

Live: https://navajeevanaorthohospitals.onrender.com · Swagger: `/docs` · Health: `/health`

Config: `render.yaml` (project root). Root dir = `backend`. Build = `pip install -r requirements.txt && python scripts/seed_knowledge_base.py`. Start = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Push to `main` → auto-deploy. Seed runs on every build, upsert is idempotent.

## Build Progress

| Phase | Status |
|---|---|
| Phase 1 — Foundation (config, state, models, safety checker) | ✅ |
| Phase 2 — Knowledge Base (ChromaDB, 9 docs, loader, seed) | ✅ |
| Phase 3 — LangGraph Agents (all 8 nodes) | ✅ |
| Phase 4 — Graph Wiring + Memory (PostgresSaver, AsyncPostgresStore) | ✅ |
| Phase 4.5 — HITL Review router | ✅ |
| Phase 5 — FastAPI + routers + Swagger | ✅ |
| Phase 6 — Render deployment | ✅ |
| Phase 7 — Next.js 16 frontend (landing page + patient portal + admin dashboard) | 🔨 In Progress |
