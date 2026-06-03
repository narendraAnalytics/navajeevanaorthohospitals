# Phase 4 Exploration Report: Graph Wiring + Memory

## Current State Summary

### Graph Architecture (BUILT & WORKING)
- **8-agent fan-out/fan-in LangGraph** fully implemented
- **Entry:** Orchestrator reads ticket → generates urgency, loads patient_history from memory (placeholder)
- **Parallel (fan-out):** 3 agents run simultaneously:
  - Intent Classifier: categorizes ticket (appointment|test_prep|report|insurance|billing|post_surgery|emergency|other)
  - Safety Checker: flags medication/symptom/emergency/report triggers
  - RAG Retriever: searches ChromaDB knowledge base (appointment FAQ, doctors, escalation rules, insurance, etc.)
- **Fan-in:** Confidence Evaluator receives all 3 outputs, sets route_decision
- **Conditional routing (3 paths):**
  1. `auto_reply` → Reply Writer → reply_text
  2. `web_search` → Tavily Search → quality gate → (if good: Reply Writer | if bad: Escalation)
  3. `escalate` → Escalation Packager → escalation_brief
- **Always:** All 3 routes converge at Memory Manager (node 8) → END
- **State management:** Uses operator.add reducer for parallel writes (classifications, safety_flags, rag_results)

**File:** `app/agent/graph.py` (78 lines, fully wired, NO missing nodes)

---

## Critical Findings

### ✅ What Exists
1. **8 nodes fully built:** Orchestrator → 3 parallel agents → Confidence Evaluator → 3 routing paths → Memory Manager → END
2. **State machine complete:** TicketState with all 20+ fields typed, operator.add reducer for concurrent writes
3. **Memory extraction logic ready:** `memory_manager.py` has LLM-based fact extraction, just needs DB persistence
4. **LLM factory configured:** 3 Groq models (pro 70B, flash 8B, lite 8B)
5. **Knowledge base loaded:** ChromaDB local with hospital docs (FAQ, doctors, escalation rules, insurance)
6. **Dependencies mostly ready:** FastAPI, SQLAlchemy, asyncpg, alembic, langgraph all installed
7. **Pydantic models defined:** TicketRequest, Response schemas ready for API

### ❌ What's Missing

**Critical blockers:**
1. **`.env` typo:** `DATABASE_URLL` (double L) not `NEON_DB_URL` → DB unreachable
2. **Missing package:** `langgraph-checkpoint-postgres` not in pyproject.toml (needed for AsyncPostgresStore)
3. **No database layer:**
   - Empty `/app/database/__init__.py`
   - No SQLAlchemy models
   - No Alembic migrations
   - No async connection pool factory
4. **No FastAPI routes:** `/app/routers/` empty, `/main.py` only prints "Hello from backend!"
5. **Graph not wired to API:** No entry point to invoke `build_graph(checkpointer=..., store=...)`
6. **Memory manager not activated:** Code is ready but `await store.aput()` line commented out

---

## Phase 4 Scope

### Immediate Fixes (Pre-Phase-4 Launch)
```
1. Fix .env: DATABASE_URLL → NEON_DB_URL
2. Add langgraph-checkpoint-postgres to pyproject.toml
```

### Phase 4 Tasks (In Order)
1. **Database models** (SQLAlchemy)
   - Patient (customer_id, medical_history JSON)
   - TicketHistory (customer_id, ticket_id, extracted_facts)
   
2. **Alembic migration** (bootstrap schema)
   
3. **PostgreSQL initialization**
   - AsyncPostgresStore for long-term memory (per-patient)
   - PostgresSaver for short-term checkpoints (per-ticket)
   - Async connection pool factory
   
4. **Graph wiring in FastAPI**
   - POST /ticket endpoint
   - Initialize graph with checkpointer + store
   - Run agent async in background
   - GET /ticket/{id} for status/reply
   
5. **Memory retrieval in Orchestrator**
   - `await store.aget(("patient", customer_id), "medical_history")`
   - Populate state.patient_history before parallel agents
   
6. **Activate memory persistence**
   - Uncomment `await store.aput()` in memory_manager.py
   - Test end-to-end: extract → store → retrieve

---

## File Inventory

**Core Agent (Ready):**
- `app/agent/graph.py` — 78 lines, complete
- `app/agent/state.py` — TicketState all fields defined
- `app/agent/edges.py` — routing logic
- `app/agent/nodes/{orchestrator,intent_classifier,safety_checker,rag_retriever,confidence_evaluator,tavily_search,reply_writer,escalation_packager,memory_manager}.py`

**Config (Ready):**
- `app/config.py` — env var definitions
- `app/constants.py` — GROQ model names
- `app/llm_factory.py` — LLM instantiation
- `.env` — API keys + DB URL (with typo)

**Models (Ready):**
- `app/models/ticket.py` — Request/Response schemas
- `app/models/agent.py` — SafetyFlag, ClassificationResult, RAGResult, EscalationBrief

**Knowledge Base (Ready):**
- `app/knowledge_base/chroma_client.py`
- `app/knowledge_base/loader.py`
- `app/knowledge_base/docs/` — 5+ markdown files

**Database (TODO):**
- `app/database/__init__.py` — empty

**Routes (TODO):**
- `app/routers/__init__.py` — empty

**Entry (TODO):**
- `main.py` — empty

---

## Readiness Assessment

| Component | Status | Details |
|-----------|--------|---------|
| Graph structure | ✅ | 8 nodes, all edges wired |
| State definition | ✅ | All 20+ fields typed |
| Memory extraction | ✅ | LLM-based fact extraction ready |
| LLM factory | ✅ | 3 Groq models configured |
| Knowledge base | ✅ | ChromaDB local, docs loaded |
| Pydantic models | ✅ | Request/Response schemas defined |
| Config/env | ⚠️ | Has typo + missing dependency |
| Database layer | ❌ | No models, migrations, pool |
| FastAPI routes | ❌ | No endpoints, no graph invocation |
| Checkpoint storage | ❌ | No AsyncPostgresStore setup |

**Summary:** Foundational code 90% complete. Phase 4 is connecting layers (DB ↔ graph ↔ API).
