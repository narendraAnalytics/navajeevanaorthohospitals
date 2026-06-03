import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)

KB_SYSTEM_PROMPT = """You are a patient communication specialist at Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Write a warm, clear, and helpful reply to the patient's query using the knowledge base information provided.

Mandatory rules:
1. Begin with: "Based on our hospital information, ..."
2. Address the patient respectfully — use "you", never "the patient".
3. Answer ONLY what was asked. Do not volunteer unrequested medical advice.
4. Be specific: include actual timings, steps, or procedures from the provided information.
5. Keep the reply under 150 words. Concise is better than comprehensive.
6. End every reply with exactly: "If you have further questions or need to speak with our team, please call our front desk or reply to this message. We are here to help you."
7. NEVER mention specific drug names, dosages, or drug interactions — escalate those.
8. NEVER fabricate doctor names, room numbers, appointment slots, or test results.
9. Tone: empathetic and professional. The patient may be worried, in pain, or anxious.
10. After drafting, self-check: Does this reply directly answer the patient's question? If not, revise."""

WEB_SYSTEM_PROMPT = """You are a patient communication specialist at Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Write a warm, clear, and helpful reply to the patient's query using general orthopedic information from web sources.

Mandatory rules:
1. Begin with: "Based on general orthopedic guidelines, ..."
2. Address the patient respectfully — use "you", never "the patient".
3. Answer ONLY what was asked. Do not volunteer unrequested medical advice.
4. Keep the reply under 150 words. Concise is better.
5. End every reply with exactly: "For information specific to your treatment at Navajeevana Orthopedic Hospital, please call our front desk or reply to this message. Our team will be happy to assist you."
6. NEVER mention specific drug names, dosages, or drug interactions.
7. NEVER make clinical recommendations — only general guidance.
8. Tone: empathetic and professional. Clarify this is general information, not personalized medical advice.
9. After drafting, self-check: Does this reply directly answer the patient's question? If not, revise."""


def reply_writer(state: TicketState) -> dict:
    """Agent 6: Writes final patient-facing reply. Handles both auto_reply (KB) and web_reply (Tavily) paths."""
    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0.2)
    route = state.get("route_decision", "auto_reply")

    patient_query = f"Subject: {state.get('subject', '')}\nMessage: {state.get('raw_text', '')}"

    if route == "auto_reply":
        rag_results = state.get("rag_results", [])
        knowledge = rag_results[0].get("answer_draft", "") if rag_results else ""
        sources_used = rag_results[0].get("sources", ["KB"]) if rag_results else ["KB"]

        human_message = f"""PATIENT QUERY:
{patient_query}

KNOWLEDGE BASE ANSWER (use this as your source):
{knowledge}

Write the patient reply now."""
        system_prompt = KB_SYSTEM_PROMPT

    else:  # web_reply
        web_results = state.get("web_results", [])
        top_results = web_results[:3] if web_results else []
        web_context = "\n\n".join(
            f"[Source {i+1}] {r['content'][:500]}" for i, r in enumerate(top_results)
        )
        sources_used = [r["url"] for r in top_results]

        human_message = f"""PATIENT QUERY:
{patient_query}

WEB SEARCH RESULTS (use as general guidance only):
{web_context}

Write the patient reply now."""
        system_prompt = WEB_SYSTEM_PROMPT

    try:
        response = llm.invoke([
            ("system", system_prompt),
            ("human", human_message),
        ])
        reply_text = response.content.strip()
    except Exception as e:
        logger.error(f"Reply writer LLM call failed: {e}")
        reply_text = (
            "Thank you for contacting Navajeevana Orthopedic Hospital. "
            "We have received your query and our team will get back to you shortly. "
            "For urgent matters, please call our front desk directly."
        )

    return {
        "reply_text": reply_text,
        "final_status": "auto_resolved",
        "sources_used": sources_used,
    }
