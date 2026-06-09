import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH
from app.knowledge_base.chroma_client import get_client

logger = logging.getLogger(__name__)

ALL_COLLECTIONS = [
    "appointment_faq",
    "test_preparation",
    "post_surgery_care",
    "insurance_billing",
    "past_tickets",
    "doctors_directory",
    "hospital_information",
    "physiotherapy_rehabilitation",
    "knee_replacement",
    "hip_replacement",
]

SYNTHESIS_PROMPT = """You are a medical knowledge retrieval AI for Navajeevana Orthopedic Hospital, Bhimavaram, Andhra Pradesh.
Retrieved documents from the hospital knowledge base are provided below.
Synthesize the most accurate, helpful answer using ONLY the information in these documents.

Strict rules:
- Use ONLY the provided documents. Do not add knowledge from outside these documents.
- If the documents do not contain the answer, respond exactly: "The knowledge base does not have specific information about this query."
- Never fabricate appointment times, doctor names, room numbers, or medical procedures.
- Never give dosage advice, drug interaction information, or surgical recommendations.
- Be specific: quote actual timings, steps, or rules from the documents when available.
- Keep the synthesis concise — 3 to 5 sentences maximum.
- Write in clear, simple English suitable for a patient."""

REWRITE_PROMPT = """You are a medical query optimizer. Rewrite the patient's question into a clear, keyword-rich search query for a hospital knowledge base. Output ONLY the rewritten query — no explanation, no preamble. 3–12 words max."""

# Keyword → collection mapping for intent-based routing
_COLLECTION_RULES: list[tuple[list[str], list[str]]] = [
    (
        ["appointment", "opd", "book", "reschedul", "timing", "slot", "walk-in", "walk in", "wait time", "availab"],
        ["appointment_faq", "doctors_directory", "hospital_information"],
    ),
    (
        ["insurance", "star health", "cashless", "tpa", "arogya", "cghs", "reimburse", "pre-auth", "preauth", "new india", "mediclaim"],
        ["insurance_billing", "hospital_information"],
    ),
    (
        ["physiotherapy", "physio", "rehab", "exercise", "recovery", "post-surgery", "post surgery", "wound", "restrict", "activity"],
        ["physiotherapy_rehabilitation", "post_surgery_care"],
    ),
    (
        ["dr.", "dr ", "doctor", "specialist", "surgeon", "ortho", "consultant"],
        ["doctors_directory", "hospital_information"],
    ),
    (
        ["mri", "ct scan", "x-ray", "xray", "fasting", "preparation", "prepare", "scan", "test prep", "before test", "before scan"],
        ["test_preparation", "hospital_information"],
    ),
    (
        ["report", "result", "lab report", "blood report", "test result", "scan result"],
        ["past_tickets", "hospital_information"],
    ),
]


def _select_collections(query: str) -> list[str]:
    """Returns narrowed collection list based on keyword matching. Falls back to all collections."""
    q = query.lower()
    for keywords, collections in _COLLECTION_RULES:
        if any(kw in q for kw in keywords):
            logger.info(f"[RAGRetriever] Collection routing → {collections}")
            return collections
    logger.info("[RAGRetriever] No keyword match — searching all collections")
    return ALL_COLLECTIONS


def _rewrite_query(raw_query: str, llm: ChatGroq) -> str:
    """Rewrites short/ambiguous patient queries into keyword-rich search queries."""
    try:
        response = llm.invoke([
            ("system", REWRITE_PROMPT),
            ("human", raw_query),
        ])
        rewritten = response.content.strip()
        logger.info(f"[RAGRetriever] Query rewrite: '{raw_query[:60]}' → '{rewritten}'")
        return rewritten
    except Exception as e:
        logger.warning(f"[RAGRetriever] Query rewrite failed: {e}. Using original query.")
        return raw_query


def _query_collection(client, collection_name: str, query: str, n_results: int = 5) -> list[dict]:
    try:
        collection = client.get_collection(collection_name)
        results = collection.query(query_texts=[query], n_results=n_results)
        docs = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        return [
            {
                "collection": collection_name,
                "content": doc,
                "similarity_score": round(1 - dist, 4),  # ChromaDB returns L2 distance
                "metadata": meta,
            }
            for doc, dist, meta in zip(docs, distances, metadatas)
        ]
    except Exception as e:
        logger.warning(f"ChromaDB query failed for '{collection_name}': {e}")
        return []


def rag_retriever(state: TicketState) -> dict:
    """Agent 4: Queries ChromaDB across selected collections, synthesizes top docs into answer_draft.
    Runs in parallel with Intent Classifier and Safety Checker."""
    raw_query = f"{state.get('subject', '')} {state.get('raw_text', '')}"
    client = get_client()
    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)

    # Rewrite only short/ambiguous queries — long detailed queries match better as-is
    query = _rewrite_query(raw_query, llm) if len(raw_query.strip()) < 80 else raw_query

    # Route to relevant collections based on query keywords
    collections = _select_collections(query)

    all_chunks: list[dict] = []
    for collection_name in collections:
        all_chunks.extend(_query_collection(client, collection_name, query))

    if not all_chunks:
        return {
            "rag_results": [{
                "answer_draft": "The knowledge base does not have specific information about this query.",
                "similarity_score": 0.0,
                "sources": [],
            }]
        }

    # Sort by similarity, take top 5 for synthesis
    all_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    top_chunks = all_chunks[:5]
    best_score = top_chunks[0]["similarity_score"]

    docs_text = "\n\n---\n\n".join(
        f"[Source: {c['collection']}]\n{c['content']}" for c in top_chunks
    )

    try:
        response = llm.invoke([
            ("system", SYNTHESIS_PROMPT),
            ("human", f"PATIENT QUERY:\n{raw_query}\n\nRETRIEVED DOCUMENTS:\n{docs_text}"),
        ])
        answer_draft = response.content.strip()
    except Exception as e:
        logger.error(f"RAG synthesis LLM call failed: {e}")
        answer_draft = "The knowledge base does not have specific information about this query."

    return {
        "rag_results": [{
            "answer_draft": answer_draft,
            "similarity_score": best_score,
            "sources": [c["collection"] for c in top_chunks],
        }]
    }
