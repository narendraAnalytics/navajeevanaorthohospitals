from app.agent.nodes.safety_checker import check_safety


def _state(text: str, subject: str = "test") -> dict:
    return {"raw_text": text, "subject": subject}


# --- 10 escalation cases ---

def test_medication_insulin():
    result = check_safety(_state("I take insulin daily, do I need to fast?"))
    flags = result["safety_flags"]
    assert len(flags) == 1
    assert flags[0]["flag_type"] == "medication"
    assert flags[0]["escalation_required"] is True
    assert "insulin" in flags[0]["trigger_words"]


def test_medication_warfarin():
    result = check_safety(_state("My doctor prescribed warfarin after my hip surgery"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)
    assert any("warfarin" in f["trigger_words"] for f in flags)


def test_medication_blood_thinner():
    result = check_safety(_state("I am on blood thinner, can I take the MRI?"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)


def test_symptom_pain():
    result = check_safety(_state("I have severe pain in my knee after surgery"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)
    assert any("pain" in f["trigger_words"] for f in flags)


def test_symptom_swelling():
    result = check_safety(_state("My leg is swelling after the operation"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)


def test_symptom_fever_and_wound():
    result = check_safety(_state("I have fever and wound is not healing"))
    flags = result["safety_flags"]
    assert len(flags) >= 1
    assert any(f["escalation_required"] for f in flags)


def test_symptom_bleeding():
    result = check_safety(_state("There is bleeding from my surgical wound"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)


def test_emergency_chest_pain():
    result = check_safety(_state("chest pain and can't breathe properly"))
    flags = result["safety_flags"]
    assert any(f["flag_type"] == "emergency" for f in flags)
    assert any(f["escalation_required"] for f in flags)


def test_report_xray():
    result = check_safety(_state("I need to understand my X-ray report results"))
    flags = result["safety_flags"]
    assert any(f["escalation_required"] for f in flags)


def test_report_mri():
    result = check_safety(_state("Can you explain my MRI scan result?"))
    flags = result["safety_flags"]
    assert any(f["flag_type"] == "report" for f in flags)


# --- 3 safe cases (must NOT escalate) ---

def test_safe_opd_timings():
    result = check_safety(_state("What are the orthopedic OPD timings on Monday?"))
    assert result["safety_flags"] == []


def test_safe_appointment():
    result = check_safety(_state("I want to book an appointment for next Tuesday"))
    assert result["safety_flags"] == []


def test_safe_insurance():
    result = check_safety(_state("Does the hospital accept Star Health insurance?"))
    assert result["safety_flags"] == []
