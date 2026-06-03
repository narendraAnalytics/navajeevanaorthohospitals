# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OrthoAI — Orthopedic Hospital AI Patient Support Agent for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh, India.
Backend only. Frontend (Next.js 15) is a separate future phase.

## Commands

All commands run from `backend/` with the `.venv` activated.

```powershell
# Activate venv (Windows)
.venv\Scripts\activate

# Run dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run all tests (offline — no Neon/Groq needed)
python -m pytest tests/ -v

# Run route tests only
python -m pytest tests/test_routes.py -v

# Run a single test
python -m pytest tests/test_safety_checker.py::test_medication_triggers_escalation -v

# Run integration test (real Groq API calls)
python -m pytest tests/test_graph_integration.py -v -s

# Add a dependency
uv add <package>

# Seed ChromaDB knowledge base (run once, or on every Railway deploy)
python scripts/seed_knowledge_base.py

# Lint
ruff check app/
black --check app/
```

## Architecture

**8-agent LangGraph StateGraph + Tavily search tool** — the core of the system.

```
[Orchestrator]  (llm_flash) → reads long-term memory, detects urgency
      ↓ (fan-out: 3 agents run simultaneously)
[Intent Classifier] [Safety Checker] [RAG Retriever]
      ↓ (fan-in)
[Confidence Evaluator] → 3 routes:
      ↓               ↓                  ↓
[Reply Writer]  [Tavily Search Tool]  [Escalation Packager]
(KB answer)     (web fallback, no LLM) (safety/low-conf)
                     ↓
               [Reply Writer]
      ↓
[Memory Manager] → writes short-term (per ticket) + long-term (per patient)
      ↓
[Human Review Queue]  ← AI never emails patients directly
      ↓
Approve & Send | Edit & Send | Assign to Senior Staff
```

**LLM** — `app/llm_factory.py` returns `(llm_pro, llm_flash, llm_lite)` using Groq directly.

- `llm_pro`   = `llama-3.3-70b-versatile` — Escalation Packager only
- `llm_flash` = `llama-3.1-8b-instant`    — Orchestrator, Intent Classifier, RAG Retriever, Reply Writer
- `llm_lite`  = `llama-3.1-8b-instant`    — Memory Manager

**Safety Checker is keyword-based (no LLM)** — deterministic, never hallucinates. Must never be converted to LLM-based.

**Tavily is a tool node, not an agent** — uses `TavilyClient` from `tavily-python` directly. No LLM call inside it.

**ChromaDB mode**:
- Local / Railway: `CHROMA_MODE=local` → `PersistentClient(path="./chroma_data")` — no server needed
- Docker/prod: `CHROMA_MODE=server` → `HttpClient(host, port)` — connects to separate container

**Memory layers**:
- Short-term: `AsyncPostgresSaver` (LangGraph checkpointer) — per `ticket_id` thread, Neon PostgreSQL
- Long-term: `AsyncPostgresStore` (LangGraph store) — per `customer_id`, persists across all tickets

## Build Progress

| Phase | Status |
|---|---|
| **Phase 1 — Foundation** (T0–T3 + Safety Checker) | ✅ Complete |
| **Phase 2 — Knowledge Base** (T4) | ✅ Complete |
| Phase 3 — LangGraph Agents (T5–T11) | ✅ Complete |
| Phase 4 — Graph Wiring + Memory (T12–T13) | ✅ Complete |
| Phase 4.5 — HITL Review (T13.5) | ✅ Complete |
| Phase 5 — FastAPI + Testing (T14) | ✅ Complete |
| Phase 6 — Render Deployment | ✅ Complete |
| Phase 7 — Next.js 15 Frontend | ⬜ Next |

## Key Files

| File | Role |
|---|---|
| `app/config.py` | All env vars via pydantic-settings `Settings` |
| `app/main.py` | FastAPI entry point — lifespan owns checkpointer/store lifecycle, CORS, routers |
| `app/llm_factory.py` | Returns `llm_pro, llm_flash, llm_lite` — import from here in all nodes |
| `app/agent/state.py` | `TicketState` TypedDict — single shared state for all 8 agents |
| `app/agent/graph.py` | `build_graph(checkpointer, store)` — wires all nodes, compiles graph |
| `app/agent/nodes/safety_checker.py` | Medical safety rules — keyword-only, never LLM. Do not change to LLM. |
| `app/agent/nodes/escalation_packager.py` | Sets both `escalation_brief` (staff) AND `reply_text` (patient warm message) |
| `app/agent/nodes/reply_writer.py` | KB reply (auto_reply) and web reply (web_reply) with disclaimer |
| `app/agent/nodes/orchestrator.py` | **async** — reads `AsyncPostgresStore` for patient history |
| `app/agent/nodes/memory_manager.py` | **async** — writes merged facts to `AsyncPostgresStore` |
| `app/constants.py` | `GROQ_MODEL_FLASH` and `GROQ_MODEL_PRO` string constants |
| `app/knowledge_base/chroma_client.py` | `get_client()` respects `CHROMA_MODE` env var |
| `app/database/connection.py` | `get_pool()` asyncpg singleton · `checkpointer_cm()` · `store_cm()` context managers |
| `app/database/queries.py` | All DB CRUD — tickets, replies, escalations, agent_logs, review + admin actions |
| `app/models/ticket.py` | `TicketRequest`, `TicketDetail` (includes `route_decision`, `confidence_score`), `TicketStatus` enum |
| `app/models/review.py` | Pydantic models for HITL review request/response |
| `app/models/admin.py` | Pydantic models for admin endpoints |
| `app/routers/tickets.py` | `POST /ticket` (202, background graph run) · `GET /ticket/{id}` |
| `app/routers/admin.py` | `GET /tickets/all` · `GET /ticket/{id}/brief` · `PATCH /ticket/{id}/resolve` |
| `app/routers/review.py` | 6 HITL review endpoints — all use `request.app.state.pool` (not get_pool()) |

## FastAPI Lifespan — Critical Pattern

`main.py` owns the checkpointer and store lifecycle via nested `async with`:

```python
async with checkpointer_cm() as checkpointer:
    await checkpointer.setup()
    async with store_cm() as store:
        await store.setup()
        app.state.graph = build_graph(checkpointer=checkpointer, store=store)
        yield   # connections stay open for full app lifetime
```

**Never** return from inside `async with checkpointer_cm()` — it closes the connection immediately.
All routers access pool and graph via `request.app.state.pool` and `request.app.state.graph`.

## Async Graph

`orchestrator` and `memory_manager` nodes are **async** (they inject `store: BaseStore`).
Always invoke: `await graph.ainvoke(state, config={"configurable": {"thread_id": ticket_id}})`.
Never use `graph.invoke()` — it will fail on async nodes.

Tests use `asyncio_mode = "auto"` (set in `pyproject.toml`) — all `async def` tests run automatically.
For offline tests (no Neon/Groq): use mocked `app.state.pool` and `app.state.graph` — see `tests/test_routes.py`.

## Reply Behavior by Route

| Route | Trigger | `reply_text` | `escalation_brief` |
|---|---|---|---|
| `auto_reply` | RAG score ≥ 0.75, no flags | KB-sourced answer, begins "Based on our hospital information..." | empty |
| `web_reply` | RAG score < 0.75, Tavily score ≥ 0.50 | Web-sourced answer + disclaimer + "until you consult our doctor..." | empty |
| `escalate` | Any safety flag OR poor Tavily results | Warm patient acknowledgment (urgency-aware) | Full staff brief |

**Escalation patient reply is urgency-aware** (`escalation_packager._build_patient_reply`):
- `critical` / `high` → "Please do not panic. Come to hospital with reports, X-rays, medicines list. Staff ready 24/7."
- `medium` → "Team will review and get back to you shortly."
- `low` → "Team will look into it and respond soon."

**Web reply always ends with disclaimer** (in `WEB_SYSTEM_PROMPT`):
> "This information has been sourced from general web resources and is not a substitute for professional medical advice. Until you consult our doctor in person, we cannot provide fully accurate guidance..."

## Database Layer

| Table | Purpose |
|---|---|
| `tickets` | One row per ticket — status, urgency, route, confidence_score, reviewed_by |
| `replies` | All reply versions kept: `ai_draft` → `edited_reply` → `final_sent_reply` |
| `escalations` | Staff escalation brief + assigned_to |
| `agent_logs` | Per-node decisions with JSONB for debugging |

Tables created via **Neon MCP** (`mcp__neon__run_sql`) — not via migration scripts.
Neon project: `navajeevanaorthohospitals` (ID: `autumn-tree-81633917`).

**Full ticket status lifecycle:**
```
processing → pending_review → approved → emailed
                           → escalated_to_senior
                           → resolved   (admin resolves manually)
```

**Reply types:** `ai_draft` → `edited_reply` → `final_sent_reply`

## Routing Logic

`confidence_evaluator` decides the path (3 routes):
1. Any `safety_flag` with `escalation_required=True` → **escalate** (overrides everything)
2. Best RAG `similarity_score >= 0.75`, no flags → **auto_reply** (KB answer)
3. RAG score < 0.75, no flags → **web_search** → `tavily_search` → quality gate:
   - Tavily score ≥ 0.50 → **web_reply** → `reply_writer`
   - Tavily score < 0.50 or no results → **escalate** → `escalation_packager`

**Safety checker keywords** (any match → escalate, no exceptions):
- SYMPTOM: `pain, swelling, fever, wound, discharge, bleeding, infection, redness, pus, numbness, tingling, dizziness, vomiting, nausea`
- MEDICATION: `insulin, warfarin, metformin, steroids, aspirin, heparin, clopidogrel, ...`
- EMERGENCY: `chest pain, can't breathe, severe, unconscious, collapse, heart attack, stroke, ambulance`
- REPORT: `x-ray, xray, mri, ct scan, scan result, report, lab report, blood report, test result`

## HITL Review Endpoints

```
GET   /review/pending               -- tickets awaiting review
GET   /review/{ticket_id}           -- full ticket + AI draft details
PATCH /review/{ticket_id}/approve   -- approve AI reply as-is
PATCH /review/{ticket_id}/edit      -- submit staff-edited reply
POST  /review/{ticket_id}/send-email-- trigger email (Phase 6: real SMTP/Resend)
PATCH /review/{ticket_id}/assign    -- assign to senior staff
```

All review endpoints use `request.app.state.pool` — NOT `get_pool()` (important for testability).

## Admin Endpoints

```
GET   /tickets/all          -- all tickets all statuses, newest first
GET   /ticket/{id}/brief    -- full escalation brief for one ticket
PATCH /ticket/{id}/resolve  -- mark resolved with human reply
```

## State Reducers

`TicketState` uses `Annotated[List[dict], operator.add]` on `classifications`, `safety_flags`, and `rag_results`. This lets 3 parallel agents write to the same list fields without overwriting. All other fields are plain `Optional[str/float]`.

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
LOG_LEVEL=INFO
```

## Render Deployment

**Live URL:** https://navajeevanaorthohospitals.onrender.com

Config file: `render.yaml` (project root).

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt && python scripts/seed_knowledge_base.py` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**ChromaDB on Render** — seeded during build, survives spin-downs. No persistent disk needed on free tier.

**Switching Groq → Gemini**: Update `GROQ_API_KEY` / `LLM_PROVIDER` env vars in Render dashboard → service auto-restarts. Code change in `app/llm_factory.py` to use `ChatGoogleGenerativeAI`.

## Knowledge Base

7 `.md` files in `app/knowledge_base/docs/`. Collections: `appointment_faq`, `test_preparation`, `post_surgery_care`, `insurance_billing`, `escalation_rules`, `past_tickets`, `doctors_directory`.
To update: edit the `.md` file → re-run `python scripts/seed_knowledge_base.py`.
