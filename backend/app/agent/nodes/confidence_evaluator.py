import logging

from app.agent.state import TicketState

logger = logging.getLogger(__name__)

# Tiered thresholds — conservative for healthcare context
RAG_AUTO_REPLY_THRESHOLD = 0.65   # KB answer reliable enough to send
RAG_WEB_SEARCH_THRESHOLD = 0.60   # below this → skip Tavily, escalate directly


def confidence_evaluator(state: TicketState) -> dict:
    """Agent 5 (fan-in, NO LLM): Waits for all 3 parallel agents, decides routing.

    Priority order (non-negotiable):
      1. Any safety flag with escalation_required=True  → escalate  (medical safety always wins)
      2. best_score >= 0.75                             → auto_reply (KB has reliable answer)
      3. 0.60 <= best_score < 0.75                     → web_search (Tavily fallback)
      4. best_score < 0.60                             → escalate  (too uncertain for Tavily)
    """
    safety_flags = state.get("safety_flags", [])
    rag_results = state.get("rag_results", [])

    # 1. Safety check — always overrides everything
    active_flags = [f for f in safety_flags if f.get("escalation_required")]
    if active_flags:
        flag_types = ", ".join(f["flag_type"] for f in active_flags)
        trigger_words = []
        for f in active_flags:
            trigger_words.extend(f.get("trigger_words", []))
        reason = f"Safety flags triggered: {flag_types}. Words: {', '.join(trigger_words)}"
        logger.info(f"[ConfidenceEval] ESCALATE — safety flags: {flag_types}")
        return {
            "route_decision": "escalate",
            "confidence_score": 0.0,
            "escalation_reason": reason,
        }

    # 2–4. RAG confidence tiers
    scores = [r.get("similarity_score", 0.0) for r in rag_results]
    best_score = max(scores) if scores else 0.0

    if best_score >= RAG_AUTO_REPLY_THRESHOLD:
        logger.info(f"[ConfidenceEval] AUTO_REPLY — RAG score: {best_score:.3f}")
        return {
            "route_decision": "auto_reply",
            "confidence_score": best_score,
            "escalation_reason": None,
        }

    if best_score >= RAG_WEB_SEARCH_THRESHOLD:
        logger.info(f"[ConfidenceEval] WEB_SEARCH — RAG score: {best_score:.3f}")
        return {
            "route_decision": "web_search",
            "confidence_score": best_score,
            "escalation_reason": None,
        }

    # Score below 0.60 — KB and Tavily both likely unreliable; escalate directly
    reason = f"RAG confidence too low for safe auto-reply (score: {best_score:.3f})"
    logger.info(f"[ConfidenceEval] ESCALATE — {reason}")
    return {
        "route_decision": "escalate",
        "confidence_score": best_score,
        "escalation_reason": reason,
    }
