# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**OrthoAI** — AI-powered patient support agent for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh, India.

Stack: FastAPI + LangGraph (8-agent graph) + ChromaDB RAG + Neon PostgreSQL + Groq LLM (→ Gemini in production).

## Repo Layout

```
backend/          ← all Python source code (FastAPI + LangGraph agents)
  CLAUDE.md       ← detailed development reference (architecture, routing, HITL, env vars)
roadmap.txt       ← full phase-by-phase build plan with task IDs and file structure
info.txt          ← LangGraph implementation notes (StateGraph, interrupt, Send API, memory)
groqinfo.txt      ← ChatGroq / langchain-groq integration reference
```

**All development happens inside `backend/`.** See `backend/CLAUDE.md` for commands, architecture details, routing logic, agent node descriptions, and environment variables.

## Build Progress

| Phase | Status |
|---|---|
| Phase 1 — Foundation (config, state, models, safety checker) | ✅ Complete |
| Phase 2 — Knowledge Base (ChromaDB, 7 docs, loader, seed script) | ✅ Complete |
| Phase 3 — LangGraph Agents (all 8 nodes + graph wiring + edges) | ✅ Complete |
| Phase 4 — Graph Wiring + Memory (PostgresSaver, AsyncPostgresStore, DB layer) | ✅ Complete |
| Phase 4.5 — HITL Review router (approve / edit / assign to senior staff) | ✅ Complete |
| Phase 5 — FastAPI app + all routers + Swagger testing | ✅ Complete |
| Phase 6 — Docker + AWS EC2 deployment | ⬜ Next |

## Quick Start

```powershell
cd backend
.venv\Scripts\activate
python -m pytest tests/ -v                              # all tests (fast unit tests)
python -m pytest tests/test_graph_integration.py -v -s  # end-to-end (real Groq API calls)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
