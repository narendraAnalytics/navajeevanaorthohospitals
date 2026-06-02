from typing import Optional, List
from pydantic import BaseModel


class SafetyFlag(BaseModel):
    flag_type: str            # medication | symptom | emergency | report
    trigger_words: List[str]
    escalation_required: bool = True


class ClassificationResult(BaseModel):
    category: str             # appointment|test_prep|report|insurance|billing|post_surgery|emergency|other
    sub_category: Optional[str] = None
    intent: str
    sentiment: str            # positive|neutral|concerned|urgent
    keywords: List[str]


class RAGResult(BaseModel):
    doc_id: str
    content: str
    similarity_score: float
    collection_name: str


class EscalationBrief(BaseModel):
    issue_summary: str
    patient_history: str
    safety_flags_triggered: List[SafetyFlag]
    suggested_action: str
    tone_note: str
    urgency_color: str        # Green|Yellow|Red|Critical


class AgentResult(BaseModel):
    node_name: str
    success: bool
    output: dict
    error_message: Optional[str] = None
