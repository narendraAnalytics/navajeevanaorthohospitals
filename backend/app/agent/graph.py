from langgraph.graph import StateGraph, START, END

from app.agent.state import TicketState
from app.agent.edges import route_after_confidence, route_after_tavily
from app.agent.nodes.orchestrator import orchestrator
from app.agent.nodes.intent_classifier import intent_classifier
from app.agent.nodes.safety_checker import check_safety
from app.agent.nodes.rag_retriever import rag_retriever
from app.agent.nodes.confidence_evaluator import confidence_evaluator
from app.agent.nodes.tavily_search import tavily_search
from app.agent.nodes.reply_writer import reply_writer
from app.agent.nodes.escalation_packager import escalation_packager
from app.agent.nodes.memory_manager import memory_manager


def build_graph(checkpointer=None, store=None):
    """Build and compile the 8-agent OrthoAI LangGraph.

    Fan-out pattern: orchestrator → 3 parallel agents → fan-in at confidence_evaluator
    3 routes: auto_reply | web_search (Tavily) | escalate
    Always ends at memory_manager regardless of route.

    checkpointer: PostgresSaver for short-term memory (per ticket thread) — wired in Phase 4
    store:        AsyncPostgresStore for long-term memory (per patient) — wired in Phase 4
    """
    builder = StateGraph(TicketState)

    # Register all nodes
    builder.add_node("orchestrator",         orchestrator)
    builder.add_node("intent_classifier",    intent_classifier)
    builder.add_node("safety_checker",       check_safety)
    builder.add_node("rag_retriever",        rag_retriever)
    builder.add_node("confidence_eval",      confidence_evaluator)
    builder.add_node("tavily_search",        tavily_search)
    builder.add_node("reply_writer",         reply_writer)
    builder.add_node("escalation_packager",  escalation_packager)
    builder.add_node("memory_manager",       memory_manager)

    # Entry point
    builder.add_edge(START, "orchestrator")

    # Fan-out: orchestrator → 3 agents run simultaneously
    builder.add_edge("orchestrator", "intent_classifier")
    builder.add_edge("orchestrator", "safety_checker")
    builder.add_edge("orchestrator", "rag_retriever")

    # Fan-in: all 3 parallel agents → confidence evaluator
    builder.add_edge("intent_classifier", "confidence_eval")
    builder.add_edge("safety_checker",    "confidence_eval")
    builder.add_edge("rag_retriever",     "confidence_eval")

    # Confidence evaluator routes to 3 paths
    builder.add_conditional_edges(
        "confidence_eval",
        route_after_confidence,
        {
            "auto_reply": "reply_writer",
            "web_search": "tavily_search",
            "escalate":   "escalation_packager",
        },
    )

    # Tavily quality gate: good results → reply, poor results → escalate
    builder.add_conditional_edges(
        "tavily_search",
        route_after_tavily,
        {
            "web_reply": "reply_writer",
            "escalate":  "escalation_packager",
        },
    )

    # Both reply paths and escalation converge at memory manager
    builder.add_edge("reply_writer",        "memory_manager")
    builder.add_edge("escalation_packager", "memory_manager")
    builder.add_edge("memory_manager",      END)

    return builder.compile(checkpointer=checkpointer, store=store)
