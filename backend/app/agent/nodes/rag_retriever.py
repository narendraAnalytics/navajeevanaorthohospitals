import logging

from langchain_groq import ChatGroq

from app.agent.state import TicketState
from app.config import settings
from app.constants import GROQ_MODEL_FLASH
from app.knowledge_base.chroma_client import get_client

logger = logging.getLogger(__name__)

COLLECTIONS = [
    "appointment_faq",
    "test_preparation",
    "post_surgery_care",
    "insurance_billing",
    "past_tickets",
    "doctors_directory",
    "hospital_information",
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


def _query_collection(client, collection_name: str, query: str, n_results: int = 2) -> list[dict]:
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
    """Agent 4: Queries ChromaDB across all collections, synthesizes top docs into answer_draft.
    Runs in parallel with Intent Classifier and Safety Checker."""
    query = f"{state.get('subject', '')} {state.get('raw_text', '')}"
    client = get_client()

    all_chunks: list[dict] = []
    for collection_name in COLLECTIONS:
        all_chunks.extend(_query_collection(client, collection_name, query))

    if not all_chunks:
        return {
            "rag_results": [{
                "answer_draft": "The knowledge base does not have specific information about this query.",
                "similarity_score": 0.0,
                "sources": [],
            }]
        }

    # Sort by similarity, take top 3 for synthesis
    all_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    top_chunks = all_chunks[:3]
    best_score = top_chunks[0]["similarity_score"]

    docs_text = "\n\n---\n\n".join(
        f"[Source: {c['collection']}]\n{c['content']}" for c in top_chunks
    )

    llm = ChatGroq(model=GROQ_MODEL_FLASH, api_key=settings.GROQ_API_KEY, temperature=0)
    try:
        response = llm.invoke([
            ("system", SYNTHESIS_PROMPT),
            ("human", f"PATIENT QUERY:\n{query}\n\nRETRIEVED DOCUMENTS:\n{docs_text}"),
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
