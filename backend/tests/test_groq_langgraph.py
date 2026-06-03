"""
Pre-Phase 3 smoke test: verify Groq API works via a minimal LangGraph graph.
Run: python -m pytest tests/test_groq_langgraph.py -v -s
"""
import os
import pytest
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

# Direct model name strings — GROQ_API_KEY is read automatically from .env
GROQ_MODEL_FLASH = "llama-3.1-8b-instant"     # most nodes
GROQ_MODEL_PRO   = "llama-3.3-70b-versatile"  # escalation packager only

SKIP_IF_NO_KEY = pytest.mark.skipif(
    not os.environ.get("GROQ_API_KEY"),
    reason="GROQ_API_KEY not set in .env"
)


class SimpleState(TypedDict):
    question: str
    answer: str


def call_groq_node(state: SimpleState) -> dict:
    llm = ChatGroq(model=GROQ_MODEL_FLASH, temperature=0)
    response = llm.invoke([
        ("system", "You are a helpful assistant for an orthopedic hospital in Bhimavaram, Andhra Pradesh. Answer briefly."),
        ("human", state["question"]),
    ])
    return {"answer": response.content}


def build_graph():
    builder = StateGraph(SimpleState)
    builder.add_node("groq_node", call_groq_node)
    builder.add_edge(START, "groq_node")
    builder.add_edge("groq_node", END)
    return builder.compile()


@SKIP_IF_NO_KEY
def test_groq_opd_question():
    """Flash model via LangGraph — typical patient OPD query."""
    graph = build_graph()
    result = graph.invoke({"question": "What are the OPD timings?", "answer": ""})

    print(f"\n--- Groq flash reply ---\n{result['answer']}\n------------------------")

    assert isinstance(result["answer"], str)
    assert len(result["answer"]) > 10


@SKIP_IF_NO_KEY
def test_groq_post_surgery_question():
    """Flash model — post-surgery patient question."""
    graph = build_graph()
    result = graph.invoke({
        "question": "I had knee replacement surgery 3 days ago. When should I start physiotherapy?",
        "answer": "",
    })

    print(f"\n--- Groq flash reply ---\n{result['answer']}\n------------------------")

    assert len(result["answer"]) > 20


@SKIP_IF_NO_KEY
def test_groq_pro_model_direct():
    """Pro model direct call (no graph) — used by Escalation Packager."""
    llm = ChatGroq(model=GROQ_MODEL_PRO, temperature=0)
    response = llm.invoke([HumanMessage(content="Reply with just: OK")])

    print(f"\n--- Groq pro reply ---\n{response.content}\n----------------------")

    assert isinstance(response.content, str)
    assert len(response.content) > 0
