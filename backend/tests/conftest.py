import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

os.environ.setdefault("CHROMA_MODE", "local")
os.environ.setdefault("APP_ENV", "test")
