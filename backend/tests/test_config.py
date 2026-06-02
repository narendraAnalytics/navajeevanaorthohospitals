from app.config import Settings


def test_settings_load():
    s = Settings()
    assert s.GROQ_API_KEY.startswith("gsk_")
    assert s.TAVILY_API_KEY.startswith("tvly-")
    assert s.CHROMA_MODE == "local"
    assert s.APP_ENV in ("development", "test")


def test_llm_factory_returns_three_models():
    from app.llm_factory import get_llms
    llm_pro, llm_flash, llm_lite = get_llms()
    assert llm_pro.model_name == "llama-3.3-70b-versatile"
    assert llm_flash.model_name == "llama-3.1-8b-instant"
    assert llm_lite.model_name == "llama-3.1-8b-instant"
