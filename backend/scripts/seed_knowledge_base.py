"""Run once to load all knowledge base .md docs into ChromaDB.
Re-run any time you update a .md file — upsert is idempotent.

Usage (from backend/):
    python scripts/seed_knowledge_base.py
"""
import sys
from pathlib import Path

# Ensure backend/ is on the path when running as a script
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.knowledge_base.loader import load_all

if __name__ == "__main__":
    print("Seeding ChromaDB knowledge base...\n")
    results = load_all()
    total = sum(results.values())
    print(f"\nDone. {len(results)} collections, {total} total chunks loaded.")
