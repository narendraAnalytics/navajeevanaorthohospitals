from app.agent.state import TicketState


def route_after_confidence(state: TicketState) -> str:
    """Fan-in decision: auto_reply | web_search | escalate"""
    return state["route_decision"]


def route_after_tavily(state: TicketState) -> str:
    """After Tavily quality gate: web_reply | escalate"""
    return state["route_decision"]
