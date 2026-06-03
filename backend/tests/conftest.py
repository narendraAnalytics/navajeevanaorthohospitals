import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

os.environ.setdefault("CHROMA_MODE", "local")
os.environ.setdefault("APP_ENV", "test")

# pytest-asyncio: run all async tests with asyncio event loop automatically
import pytest

def pytest_configure(config):
    config.addinivalue_line("markers", "asyncio: mark test as async")
