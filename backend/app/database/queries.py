"""Application-level CRUD queries using asyncpg pool.

These tables store OrthoAI ticket lifecycle data for the HITL review
dashboard (Phase 4.5) and admin reporting (Phase 5).
"""
import json
import logging
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)


async def save_ticket(
    pool: asyncpg.Pool,
    ticket_id: str,
    customer_id: str,
    subject: str,
    raw_text: str,
) -> None:
    await pool.execute(
        """INSERT INTO tickets (id, customer_id, subject, raw_text)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING""",
        ticket_id, customer_id, subject, raw_text,
    )


async def update_ticket_status(
    pool: asyncpg.Pool,
    ticket_id: str,
    urgency: str | None = None,
    category: str | None = None,
    sentiment: str | None = None,
    confidence_score: float | None = None,
    route_decision: str | None = None,
    final_status: str | None = None,
) -> None:
    await pool.execute(
        """UPDATE tickets SET
               urgency = COALESCE($2, urgency),
               category = COALESCE($3, category),
               sentiment = COALESCE($4, sentiment),
               confidence_score = COALESCE($5, confidence_score),
               route_decision = COALESCE($6, route_decision),
               final_status = COALESCE($7, final_status),
               updated_at = NOW()
           WHERE id = $1""",
        ticket_id, urgency, category, sentiment,
        confidence_score, route_decision, final_status,
    )


async def save_reply(
    pool: asyncpg.Pool,
    ticket_id: str,
    reply_text: str,
    reply_type: str = "ai_draft",
    sent_by: str = "ai",
) -> None:
    await pool.execute(
        """INSERT INTO replies (ticket_id, reply_text, reply_type, sent_by)
           VALUES ($1, $2, $3, $4)""",
        ticket_id, reply_text, reply_type, sent_by,
    )


async def save_escalation(
    pool: asyncpg.Pool,
    ticket_id: str,
    brief: str,
    reason: str,
) -> None:
    await pool.execute(
        """INSERT INTO escalations (ticket_id, escalation_brief, escalation_reason)
           VALUES ($1, $2, $3)""",
        ticket_id, brief, reason,
    )


async def get_pending_review_tickets(pool: asyncpg.Pool) -> list[dict]:
    rows = await pool.fetch(
        """SELECT t.id, t.customer_id, t.customer_name, t.customer_email,
                  t.subject, t.urgency, t.confidence_score, t.route_decision,
                  t.final_status, t.created_at,
                  r.reply_text AS ai_draft,
                  e.escalation_brief
           FROM tickets t
           LEFT JOIN replies r ON r.ticket_id = t.id AND r.reply_type = 'ai_draft'
           LEFT JOIN escalations e ON e.ticket_id = t.id
           WHERE t.final_status = 'pending_review'
           ORDER BY t.created_at ASC"""
    )
    return [dict(r) for r in rows]


async def get_ticket_review_detail(pool: asyncpg.Pool, ticket_id: str) -> dict | None:
    row = await pool.fetchrow(
        """SELECT t.*, r.reply_text AS ai_draft, r.reply_type,
                  e.escalation_brief, e.escalation_reason, e.assigned_to
           FROM tickets t
           LEFT JOIN replies r ON r.ticket_id = t.id AND r.reply_type = 'ai_draft'
           LEFT JOIN escalations e ON e.ticket_id = t.id
           WHERE t.id = $1""",
        ticket_id,
    )
    return dict(row) if row else None


async def approve_ticket(pool: asyncpg.Pool, ticket_id: str, reviewed_by: str) -> None:
    await pool.execute(
        """UPDATE tickets SET final_status = 'approved', reviewed_by = $2, updated_at = NOW()
           WHERE id = $1""",
        ticket_id, reviewed_by,
    )


async def save_edited_reply(
    pool: asyncpg.Pool, ticket_id: str, edited_text: str, reviewed_by: str
) -> None:
    await pool.execute(
        """INSERT INTO replies (ticket_id, reply_text, reply_type, sent_by)
           VALUES ($1, $2, 'edited_reply', $3)""",
        ticket_id, edited_text, reviewed_by,
    )
    await pool.execute(
        """UPDATE tickets SET final_status = 'approved', reviewed_by = $2, updated_at = NOW()
           WHERE id = $1""",
        ticket_id, reviewed_by,
    )


async def mark_ticket_emailed(pool: asyncpg.Pool, ticket_id: str) -> None:
    await pool.execute(
        """UPDATE tickets SET final_status = 'emailed', updated_at = NOW() WHERE id = $1""",
        ticket_id,
    )
    await pool.execute(
        """INSERT INTO replies (ticket_id, reply_text, reply_type, sent_by)
           SELECT $1, reply_text, 'final_sent_reply', sent_by
           FROM replies
           WHERE ticket_id = $1 AND reply_type IN ('edited_reply', 'ai_draft')
           ORDER BY created_at DESC
           LIMIT 1""",
        ticket_id,
    )


async def assign_to_senior(
    pool: asyncpg.Pool, ticket_id: str, assigned_to: str, reviewed_by: str
) -> None:
    await pool.execute(
        """UPDATE tickets SET final_status = 'escalated_to_senior',
               reviewed_by = $2, updated_at = NOW()
           WHERE id = $1""",
        ticket_id, reviewed_by,
    )
    await pool.execute(
        """UPDATE escalations SET assigned_to = $2 WHERE ticket_id = $1""",
        ticket_id, assigned_to,
    )


async def log_agent_decision(
    pool: asyncpg.Pool,
    ticket_id: str,
    node_name: str,
    decision: str,
    confidence_score: float | None,
    input_data: dict[str, Any] | None = None,
    output_data: dict[str, Any] | None = None,
) -> None:
    await pool.execute(
        """INSERT INTO agent_logs
               (ticket_id, node_name, decision, confidence_score, input_data, output_data)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)""",
        ticket_id, node_name, decision, confidence_score,
        json.dumps(input_data or {}),
        json.dumps(output_data or {}),
    )
