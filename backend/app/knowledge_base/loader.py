import re
from pathlib import Path
from app.knowledge_base.chroma_client import get_client

DOCS_DIR = Path(__file__).parent / "docs"

# Each .md file maps to a ChromaDB collection name
COLLECTION_MAP = {
    "appointment_faq.md":    "appointment_faq",
    "test_preparation.md":   "test_preparation",
    "post_surgery_care.md":  "post_surgery_care",
    "insurance_billing.md":  "insurance_billing",
    "escalation_rules.md":       "escalation_rules",
    "past_tickets.md":           "past_tickets",
    "doctors_directory.md":      "doctors_directory",
    "hospital_information.md":          "hospital_information",
    "physiotherapy_rehabilitation.md":  "physiotherapy_rehabilitation",
    "knee_replacement.md":              "knee_replacement",
}


def _chunk_by_heading(text: str, doc_name: str) -> list[dict]:
    """Split markdown into chunks on ## or ### headings. Returns list of {id, text}."""
    chunks = []
    # Split on lines that start with # (any level)
    parts = re.split(r'\n(?=#{1,3} )', text)

    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
        chunk_id = f"{doc_name}_chunk_{i}"
        chunks.append({"id": chunk_id, "text": part})

    return chunks


def load_and_upsert(doc_filename: str) -> int:
    """Load one .md file, chunk it, upsert all chunks into its ChromaDB collection.
    Returns number of chunks upserted."""
    collection_name = COLLECTION_MAP.get(doc_filename)
    if not collection_name:
        raise ValueError(f"No collection mapping for {doc_filename!r}")

    path = DOCS_DIR / doc_filename
    if not path.exists():
        raise FileNotFoundError(f"Doc not found: {path}")

    text = path.read_text(encoding="utf-8")
    chunks = _chunk_by_heading(text, collection_name)

    client = get_client()
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    collection.upsert(
        ids=[c["id"] for c in chunks],
        documents=[c["text"] for c in chunks],
    )

    return len(chunks)


def load_all() -> dict[str, int]:
    """Load all .md docs into ChromaDB. Returns {collection_name: chunk_count}."""
    results = {}
    for filename in COLLECTION_MAP:
        path = DOCS_DIR / filename
        if not path.exists():
            print(f"  SKIP  {filename} (file not found)")
            continue
        count = load_and_upsert(filename)
        results[filename] = count
        print(f"  OK    {filename} -> {count} chunks")
    return results
