import logging

from tavily import TavilyClient

from app.agent.state import TicketState
from app.config import settings

logger = logging.getLogger(__name__)

TAVILY_SCORE_THRESHOLD = 0.50


def tavily_search(state: TicketState) -> dict:
    """Tavily web search fallback (NO LLM). Only runs when RAG confidence < 0.75 and no safety flags.

    Quality gate:
      best Tavily result score >= 0.50  -> route = 'web_reply'  -> Reply Writer uses web_results
      score < 0.50 or no results        -> route = 'escalate'   -> never reply with poor sources
    """
    query = f"{state.get('raw_text', '')} orthopedic hospital Andhra Pradesh"

    try:
        client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        response = client.search(
            query=query,
            max_results=5,
            search_depth="advanced",
        )
        raw_results = response.get("results", [])
    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        return {
            "web_results": [],
            "route_decision": "escalate",
            "escalation_reason": "Web search failed — escalating to human staff.",
        }

    if not raw_results:
        logger.info("[Tavily] No results returned — escalate")
        return {
            "web_results": [],
            "route_decision": "escalate",
            "escalation_reason": "Web search returned no results — escalating to human staff.",
        }

    web_results = [
        {
            "url": item.get("url", ""),
            "content": item.get("content", ""),
            "score": float(item.get("score", 0.0)),
        }
        for item in raw_results
    ]

    best_score = max(r["score"] for r in web_results)

    if best_score >= TAVILY_SCORE_THRESHOLD:
        logger.info(f"[Tavily] WEB_REPLY — best score: {best_score:.3f}")
        return {
            "web_results": web_results,
            "route_decision": "web_reply",
        }

    logger.info(f"[Tavily] ESCALATE — best score too low: {best_score:.3f}")
    return {
        "web_results": web_results,
        "route_decision": "escalate",
        "escalation_reason": f"Web search quality too low (best score: {best_score:.2f}) — escalating to human staff.",
    }
