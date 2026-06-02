# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OrthoAI — Orthopedic Hospital AI Patient Support Agent for Andhra Pradesh, India.
Backend only. Frontend (Next.js 15) is a separate future phase.

## Commands

All commands run from `backend/` with the `.venv` activated.

```powershell
# Activate venv (Windows)
.venv\Scripts\activate

# Run dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run all tests
python -m pytest tests/ -v

# Run a single test file
python -m pytest tests/test_safety_checker.py -v

# Run a single test by name
python -m pytest tests/test_safety_checker.py::test_medication_triggers_escalation -v

# Add a dependency
uv add <package>

# Seed ChromaDB knowledge base (run once after writing .md docs)
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
```

**LLM** — `app/llm_factory.py` returns `(llm_pro, llm_flash, llm_lite)` using Groq directly.

- `llm_pro`   = `llama-3.3-70b-versatile` — Escalation Packager only
- `llm_flash` = `llama-3.1-8b-instant`    — Orchestrator, Intent Classifier, RAG Retriever, Reply Writer
- `llm_lite`  = `llama-3.1-8b-instant`    — Memory Manager (same model, no separate lite tier on Groq)

**Safety Checker is keyword-based (no LLM)** — deterministic, never hallucinates. Must never be converted to LLM-based.

**Tavily is a tool node, not an agent** — `TavilySearchResults` from `langchain-community`. No LLM call inside it. Medication / symptom / emergency / report keywords always force escalation regardless of RAG confidence score.

**ChromaDB mode**:
- Local dev: `CHROMA_MODE=local` → `PersistentClient(path="./chroma_data")` — no server needed
- AWS/prod: `CHROMA_MODE=server` → `HttpClient(host, port)` — connects to Docker container

**Memory layers**:
- Short-term: `PostgresSaver` (LangGraph checkpointer) — per `ticket_id` thread, Neon PostgreSQL
- Long-term: `AsyncPostgresStore` (LangGraph store) — per `customer_id`, persists across all sessions

## Build Progress

| Phase | Status |
|---|---|
| **Phase 1 — Foundation** (T0–T3 + Safety Checker) | ✅ Complete |
| **Phase 2 — Knowledge Base** (T4) | ✅ Complete |
| Phase 3 — LangGraph Agents (T5–T11) | ⬜ Pending |
| Phase 4 — Graph Wiring + Memory (T12–T13) | ⬜ Pending |
| Phase 5 — FastAPI + Testing (T14) | ⬜ Pending |
| Phase 6 — Docker (T16) | ⬜ Pending |

## Key Files (once built)

| File | Role |
|---|---|
| `app/config.py` | All env vars via pydantic-settings `Settings` |
| `app/llm_factory.py` | Returns `llm_pro, llm_flash, llm_lite` — import from here in all nodes |
| `app/agent/state.py` | `TicketState` TypedDict — single shared state for all 9 agents |
| `app/agent/graph.py` | `build_graph(checkpointer, store)` — wires all nodes, compiles graph |
| `app/agent/nodes/safety_checker.py` | Medical safety rules — most critical file, keyword-only |
| `app/agent/nodes/tavily_search.py` | Web search fallback via `TavilySearchResults` (langchain-community) |
| `app/knowledge_base/chroma_client.py` | `get_client()` respects `CHROMA_MODE` env var |

## State Reducers

`TicketState` uses `Annotated[List[dict], operator.add]` on `classifications`, `safety_flags`, and `rag_results`. This lets the 3 parallel agents write to the same list fields without overwriting each other. `web_results` is `Optional[List[dict]]` — set only when route is `web_search`. All other fields are plain `Optional[str/float]`.

## Routing Logic

`confidence_evaluator` decides the path (3 routes):
1. Any `safety_flag` with `escalation_required=True` → **escalate** (overrides everything)
2. Best RAG `similarity_score >= 0.80`, no flags → **auto_reply** (use KB answer)
3. RAG score < 0.80, no flags → **web_search** → `tavily_search` node → quality gate:
   - Tavily score >= 0.50 → **web_reply** → `reply_writer` (use web answer)
   - Tavily score < 0.50 or no results → **escalate** → `escalation_packager` (poor sources)

Tavily is the fallback **before** escalating for low-confidence queries. Poor Tavily results escalate to human rather than generating an unreliable reply.

## Environment Variables

```
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-...     # from app.tavily.com — used by tavily_search node
NEON_DB_URL=postgresql://...
CHROMA_MODE=local           # local | server
CHROMA_HOST=localhost       # server mode only
CHROMA_PORT=8001            # server mode only
ALLOWED_ORIGIN=http://localhost:3000
APP_ENV=development
LOG_LEVEL=INFO
```

## Knowledge Base

6 `.md` files in `app/knowledge_base/docs/`. Loaded into ChromaDB by running `seed_knowledge_base.py`. To update: edit the `.md` file and re-run the seed script. Collections: `appointment_faq`, `test_preparation`, `post_surgery_care`, `insurance_billing`, `past_tickets`.
