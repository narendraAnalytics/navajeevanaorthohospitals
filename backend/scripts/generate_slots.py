"""Generate fixed 4 slots per working day for all active doctors (next 30 days).

Fixed slots:
  09:00 → Morning 1
  10:30 → Morning 2
  14:00 → Evening 1
  15:30 → Evening 2

Run once or re-run (ON CONFLICT DO NOTHING — fully idempotent):
    python scripts/generate_slots.py
"""
import asyncio
import sys
from datetime import date, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg
from app.config import settings

FIXED_SLOTS = [
    (time(9, 0),  "Morning 1"),
    (time(10, 30), "Morning 2"),
    (time(14, 0), "Evening 1"),
    (time(15, 30), "Evening 2"),
]

DAY_MAP = {
    0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun",
}


async def generate():
    conn = await asyncpg.connect(settings.NEON_DB_URL)
    try:
        doctors = await conn.fetch("SELECT id FROM doctors WHERE is_active = TRUE")

        holidays = set(
            row["date"]
            for row in await conn.fetch("SELECT date FROM hospital_holidays")
        )

        today = date.today()
        total = 0

        for doctor in doctors:
            doctor_id = doctor["id"]

            schedule_rows = await conn.fetch(
                "SELECT day_of_week FROM doctor_schedules WHERE doctor_id = $1",
                doctor_id,
            )
            working_days = {row["day_of_week"] for row in schedule_rows}

            unavailable = set(
                row["date"]
                for row in await conn.fetch(
                    "SELECT date FROM doctor_unavailability WHERE doctor_id = $1", doctor_id
                )
            )

            for offset in range(1, 31):
                slot_date = today + timedelta(days=offset)
                day_name = DAY_MAP[slot_date.weekday()]

                if day_name not in working_days:
                    continue
                if slot_date in holidays:
                    continue
                if slot_date in unavailable:
                    continue

                for slot_time, label in FIXED_SLOTS:
                    await conn.execute(
                        """INSERT INTO appointment_slots
                               (doctor_id, slot_date, slot_time, label, status)
                           VALUES ($1, $2, $3, $4, 'available')
                           ON CONFLICT (doctor_id, slot_date, slot_time) DO NOTHING""",
                        doctor_id, slot_date, slot_time, label,
                    )
                    total += 1

        print(f"Generated {total} slot rows (skipping conflicts).")
    finally:
        await conn.close()


if __name__ == "__main__":
    print("Generating appointment slots...\n")
    asyncio.run(generate())
