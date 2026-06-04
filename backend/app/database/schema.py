CREATE_TICKETS = """
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    subject TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    urgency TEXT,
    category TEXT,
    sentiment TEXT,
    confidence_score FLOAT,
    route_decision TEXT,
    final_status TEXT,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);"""

CREATE_REPLIES = """
CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ticket_id TEXT REFERENCES tickets(id),
    reply_text TEXT,
    reply_type TEXT,
    sent_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);"""

CREATE_ESCALATIONS = """
CREATE TABLE IF NOT EXISTS escalations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ticket_id TEXT REFERENCES tickets(id),
    escalation_brief TEXT,
    escalation_reason TEXT,
    assigned_to TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);"""

CREATE_AGENT_LOGS = """
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    ticket_id TEXT,
    node_name TEXT,
    decision TEXT,
    confidence_score FLOAT,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);"""

ALL_TABLES = [CREATE_TICKETS, CREATE_REPLIES, CREATE_ESCALATIONS, CREATE_AGENT_LOGS]
