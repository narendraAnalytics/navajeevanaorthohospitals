"""Seed doctors and their schedules from doctors_directory.md knowledge base.

Run once (or re-run — uses ON CONFLICT DO NOTHING):
    python scripts/seed_doctors.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg
from app.config import settings

DOCTORS = [
    {"id": "dr_arjun_reddy",   "full_name": "Dr. Arjun Reddy",   "specialization": "Joint Replacement Surgery", "branch": "Vijayawada"},
    {"id": "dr_meera_nair",    "full_name": "Dr. Meera Nair",    "specialization": "Sports Medicine",           "branch": "Vijayawada"},
    {"id": "dr_kiran_kumar",   "full_name": "Dr. Kiran Kumar",   "specialization": "Spine Care",                "branch": "Eluru"},
    {"id": "dr_priya_sharma",  "full_name": "Dr. Priya Sharma",  "specialization": "Pediatric Orthopedics",    "branch": "Bhimavaram"},
    {"id": "dr_vivek_rao",     "full_name": "Dr. Vivek Rao",     "specialization": "Trauma & Fracture Care",   "branch": "Bhimavaram"},
    {"id": "dr_lakshmi_devi",  "full_name": "Dr. Lakshmi Devi",  "specialization": "Arthroscopy",              "branch": "Palakollu"},
    {"id": "dr_sandeep_varma", "full_name": "Dr. Sandeep Varma", "specialization": "Orthopedic Oncology",      "branch": "Vijayawada"},
    {"id": "dr_ananya_reddy",  "full_name": "Dr. Ananya Reddy",  "specialization": "General Orthopedics",      "branch": "Eluru"},
]

# Mon-Sat for all doctors; Vivek Rao Mon-Fri only (trauma surgeon)
SCHEDULES = {
    "dr_arjun_reddy":   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "dr_meera_nair":    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "dr_kiran_kumar":   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "dr_priya_sharma":  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "dr_vivek_rao":     ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "dr_lakshmi_devi":  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "dr_sandeep_varma": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "dr_ananya_reddy":  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
}


async def seed():
    conn = await asyncpg.connect(settings.NEON_DB_URL)
    try:
        for doc in DOCTORS:
            await conn.execute(
                """INSERT INTO doctors (id, full_name, specialization, branch, is_active)
                   VALUES ($1, $2, $3, $4, TRUE)
                   ON CONFLICT (id) DO NOTHING""",
                doc["id"], doc["full_name"], doc["specialization"], doc["branch"],
            )
            print(f"  Doctor: {doc['full_name']} ({doc['branch']})")

        for doctor_id, days in SCHEDULES.items():
            for day in days:
                await conn.execute(
                    """INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time)
                       VALUES ($1, $2, '09:00', '17:00')
                       ON CONFLICT DO NOTHING""",
                    doctor_id, day,
                )

        print(f"\nSeeded {len(DOCTORS)} doctors with schedules.")
    finally:
        await conn.close()


if __name__ == "__main__":
    print("Seeding doctors...\n")
    asyncio.run(seed())
