"""Appointment Booking LangGraph.

Sequential graph — no fan-out needed (all DB operations must happen in order).

Flow:
  START → booking_orchestrator → slot_validator → availability_checker
        → [conditional on availability_result]
              "available" → slot_hold_agent
              "taken"     → alternative_suggester → END
              "invalid"   → error_packager → END
        → slot_hold_agent
        → [conditional on hold_result]
              "held"   → slot_reservation_agent
              "failed" → alternative_suggester → END
        → slot_reservation_agent → notification_agent → audit_logger → memory_updater → END
"""
from langgraph.graph import StateGraph, START, END

from app.agent.appointment_state import AppointmentState
from app.agent.appointment_nodes.booking_orchestrator import booking_orchestrator
from app.agent.appointment_nodes.slot_validator import slot_validator
from app.agent.appointment_nodes.availability_checker import availability_checker
from app.agent.appointment_nodes.slot_hold_agent import slot_hold_agent
from app.agent.appointment_nodes.slot_reservation_agent import slot_reservation_agent
from app.agent.appointment_nodes.notification_agent import notification_agent
from app.agent.appointment_nodes.alternative_suggester import alternative_suggester
from app.agent.appointment_nodes.error_packager import error_packager
from app.agent.appointment_nodes.audit_logger import audit_logger
from app.agent.appointment_nodes.memory_updater import memory_updater


def _route_after_availability(state: AppointmentState) -> str:
    result = state.get("availability_result")
    if result == "available":
        return "available"
    if result == "taken":
        return "taken"
    return "invalid"


def _route_after_hold(state: AppointmentState) -> str:
    return "held" if state.get("hold_result") == "held" else "failed"


def build_appointment_graph(checkpointer=None, store=None):
    builder = StateGraph(AppointmentState)

    builder.add_node("booking_orchestrator",   booking_orchestrator)
    builder.add_node("slot_validator",         slot_validator)
    builder.add_node("availability_checker",   availability_checker)
    builder.add_node("slot_hold_agent",        slot_hold_agent)
    builder.add_node("slot_reservation_agent", slot_reservation_agent)
    builder.add_node("notification_agent",     notification_agent)
    builder.add_node("alternative_suggester",  alternative_suggester)
    builder.add_node("error_packager",         error_packager)
    builder.add_node("audit_logger",           audit_logger)
    builder.add_node("memory_updater",         memory_updater)

    builder.add_edge(START, "booking_orchestrator")
    builder.add_edge("booking_orchestrator", "slot_validator")
    builder.add_edge("slot_validator", "availability_checker")

    builder.add_conditional_edges(
        "availability_checker",
        _route_after_availability,
        {
            "available": "slot_hold_agent",
            "taken":     "alternative_suggester",
            "invalid":   "error_packager",
        },
    )

    builder.add_conditional_edges(
        "slot_hold_agent",
        _route_after_hold,
        {
            "held":   "slot_reservation_agent",
            "failed": "alternative_suggester",
        },
    )

    builder.add_edge("slot_reservation_agent", "notification_agent")
    builder.add_edge("notification_agent",     "audit_logger")
    builder.add_edge("audit_logger",           "memory_updater")
    builder.add_edge("memory_updater",         END)

    builder.add_edge("alternative_suggester", END)
    builder.add_edge("error_packager",        END)

    return builder.compile(checkpointer=checkpointer, store=store)
