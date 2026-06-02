from langchain_groq import ChatGroq
from app.config import settings
from app.constants import GROQ_MODEL_PRO, GROQ_MODEL_FLASH


def get_llms() -> tuple[ChatGroq, ChatGroq, ChatGroq]:
    """Returns (llm_pro, llm_flash, llm_lite).

    llm_pro   — llama-3.3-70b-versatile  (Escalation Packager only)
    llm_flash — llama-3.1-8b-instant     (Orchestrator, Intent Classifier, RAG Retriever, Reply Writer)
    llm_lite  — llama-3.1-8b-instant     (Memory Manager — same model, no separate lite tier on Groq)
    """
    llm_pro = ChatGroq(model=GROQ_MODEL_PRO, api_key=settings.GROQ_API_KEY, temperature=0)
    llm_flash = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)
    llm_lite = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)
    return llm_pro, llm_flash, llm_lite
