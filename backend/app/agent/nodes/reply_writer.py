import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH

logger = logging.getLogger(__name__)

KB_SYSTEM_PROMPT = """You are a patient communication specialist at Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh.
Write a warm, caring, and helpful reply to the patient's query using the knowledge base information provided.

Mandatory rules:
1. Begin with: "At Navajeevana Ortho Hospitals, ..." — always name the hospital explicitly in the opening.
2. After the factual answer, include one warm, positive sentence about the hospital's commitment to patient care (e.g. our experienced orthopedic team, state-of-the-art facilities, compassionate care, or dedication to your recovery).
3. Address the patient respectfully — use "you", never "the patient".
4. Answer ONLY what was asked. Do not volunteer unrequested medical advice.
5. Be specific: include actual timings, steps, or procedures from the provided information.
6. Keep the reply under 160 words.
7. End every reply with exactly: "If you have further questions or need to speak with our team, please call our front desk or reply to this message. Navajeevana Ortho Hospitals is here to support you every step of the way."
8. NEVER mention specific drug names, dosages, or drug interactions — escalate those.
9. NEVER fabricate doctor names, room numbers, appointment slots, or test results.
10. Tone: empathetic, warm, and professional. The patient may be worried, in pain, or anxious.
11. After drafting, self-check: Does this reply directly answer the patient's question? If not, revise."""

WEB_SYSTEM_PROMPT = """You are a patient communication specialist at Navajeevana Ortho Hospitals, Bhimavaram, Andhra Pradesh.
Write a warm, clear, and helpful reply to the patient's query using general orthopedic information from web sources.

Mandatory rules:
1. Begin with: "[Web Search Result] The following is general information sourced from the web and is not specific to Navajeevana Ortho Hospitals."
2. On the next line, provide the answer to the patient's question using the web search results.
3. Address the patient respectfully — use "you", never "the patient".
4. Answer ONLY what was asked. Do not volunteer unrequested medical advice.
5. Keep the answer section under 120 words. Concise is better.
6. NEVER mention specific drug names, dosages, or drug interactions.
7. NEVER make clinical recommendations — only general guidance.
8. Tone: empathetic and professional.
9. After the answer, end every reply with EXACTLY this closing (do not change it):

---
Please note: This information has been sourced from general web resources and is not a substitute for professional medical advice. Until you consult our doctor in person, we cannot provide you with fully accurate guidance specific to your condition.

For information specific to Navajeevana Ortho Hospitals regarding your {ISSUE}, please contact us directly at +91 9494559848 or visit us. Our dedicated team will be happy to assist you.
---

Replace {ISSUE} with the patient's actual subject/topic in the closing message.
10. After drafting, self-check: Does this reply directly answer the patient's question? If not, revise."""


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
