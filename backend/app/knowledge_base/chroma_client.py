import chromadb
from app.config import settings

_client = None


def get_client() -> chromadb.ClientAPI:
    global _client
    if _client is not None:
        return _client

    if settings.CHROMA_MODE == "server":
        _client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
    else:
        _client = chromadb.PersistentClient(path="./chroma_data")

    return _client
