MEDICATION_WORDS = {
    "insulin", "warfarin", "metformin", "steroids", "steroid",
    "blood thinner", "blood-thinner", "anticoagulant", "aspirin",
    "heparin", "clopidogrel", "ramipril",
}

SYMPTOM_WORDS = {
    "pain", "swelling", "fever", "wound", "discharge", "bleeding",
    "infection", "redness", "pus", "numb", "numbness", "tingling",
    "not healing", "dizziness", "vomiting", "nausea",
}

EMERGENCY_WORDS = {
    "chest pain", "can't breathe", "cannot breathe", "severe",
    "unconscious", "collapse", "collapsed", "heart attack",
    "stroke", "emergency", "ambulance",
}

REPORT_WORDS = {
    "x-ray", "xray", "mri", "ct scan", "scan result", "report",
    "lab report", "blood report", "test result",
}


def _matches(text: str, word_set: set) -> list[str]:
    text_lower = text.lower()
    return [w for w in word_set if w in text_lower]


def check_safety(state: dict) -> dict:
    """Keyword-based safety check. Deterministic, no LLM — never hallucinates."""
    text = state.get("raw_text", "") + " " + state.get("subject", "")
    flags = []

    if hits := _matches(text, MEDICATION_WORDS):
        flags.append({"flag_type": "medication", "trigger_words": hits, "escalation_required": True})

    if hits := _matches(text, SYMPTOM_WORDS):
        flags.append({"flag_type": "symptom", "trigger_words": hits, "escalation_required": True})

    if hits := _matches(text, EMERGENCY_WORDS):
        flags.append({"flag_type": "emergency", "trigger_words": hits, "escalation_required": True})

    if hits := _matches(text, REPORT_WORDS):
        flags.append({"flag_type": "report", "trigger_words": hits, "escalation_required": True})

    return {"safety_flags": flags}
