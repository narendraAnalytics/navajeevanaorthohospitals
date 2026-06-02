# Past Resolved Tickets — Navajeevana Ortho Hospitals

## Purpose

This document contains anonymized examples of previously resolved patient support tickets.

The AI system uses these examples to:

* Match similar patient queries
* Improve retrieval quality
* Learn escalation patterns
* Improve response consistency

Patient names, identifiers, and medical record numbers are never stored.

---

# Appointment Tickets

## Ticket A-001

Patient Query:

"What are the orthopedic OPD timings in the Bhimavaram branch?"

Category:

appointment

Resolution:

Orthopedic OPD services are available Monday through Saturday from 9:00 AM to 6:00 PM. Sunday is reserved for emergency services only.

Status:

auto_resolved

---

## Ticket A-002

Patient Query:

"I want to book an appointment with a knee specialist."

Category:

appointment

Resolution:

Patients may schedule appointments through the hospital website, appointment helpline, or reception desk. Specialist appointments are subject to availability.

Status:

auto_resolved

---

## Ticket A-003

Patient Query:

"I cannot attend tomorrow's appointment. Can I change it to Friday?"

Category:

appointment

Resolution:

Appointments may be rescheduled through the website, by phone, or at the reception desk. Patients are encouraged to provide at least 24 hours' notice whenever possible.

Status:

auto_resolved

---

## Ticket A-004

Patient Query:

"My father is elderly. Can I book the appointment on his behalf?"

Category:

appointment

Resolution:

Yes. Family members may book appointments on behalf of patients.

Status:

auto_resolved

---

## Ticket A-005

Patient Query:

"Do I need a referral before visiting an orthopedic doctor?"

Category:

appointment

Resolution:

No referral is required. Patients may directly schedule appointments with orthopedic specialists.

Status:

auto_resolved

---

# Test Preparation Tickets

## Ticket T-001

Patient Query:

"Do I need to fast before my blood test tomorrow morning?"

Category:

test_preparation

Resolution:

Patients should follow the preparation instructions provided by their doctor or diagnostic center. General fasting instructions may vary by test type.

Status:

auto_resolved

---

## Ticket T-002

Patient Query:

"What should I avoid before an MRI scan?"

Category:

test_preparation

Resolution:

Patients should follow MRI preparation instructions provided during scheduling. Metal objects, jewelry, and certain accessories may need to be removed before the scan.

Status:

auto_resolved

---

## Ticket T-003

Patient Query:

"I take insulin every day. Should I skip my insulin before the blood test?"

Category:

test_preparation

Resolution:

Escalated to doctor. Medication-related questions require clinical review.

Status:

escalated

Escalation Reason:

Medication keyword detected (insulin).

---

## Ticket T-004

Patient Query:

"I take blood thinner tablets. Can I continue them before my procedure?"

Category:

test_preparation

Resolution:

Escalated to doctor. Medication-related questions require clinical review.

Status:

escalated

Escalation Reason:

Medication keyword detected (blood thinner).

---

# Post-Surgery Tickets

## Ticket P-001

Patient Query:

"When can I start walking after knee replacement surgery?"

Category:

post_surgery

Resolution:

Patients should follow the recovery plan provided by their orthopedic surgeon and physiotherapy team. Recovery timelines vary depending on the procedure and individual circumstances.

Status:

auto_resolved

---

## Ticket P-002

Patient Query:

"What foods should I eat after hip replacement surgery?"

Category:

post_surgery

Resolution:

Patients are encouraged to maintain a balanced diet that supports recovery. Specific dietary recommendations should follow the surgeon's instructions.

Status:

auto_resolved

---

## Ticket P-003

Patient Query:

"My surgical wound is swollen and I have a fever."

Category:

post_surgery

Resolution:

Escalated immediately to orthopedic team.

Status:

escalated

Escalation Reason:

Fever and wound swelling detected.

---

## Ticket P-004

Patient Query:

"There is yellow discharge coming from my surgical wound."

Category:

post_surgery

Resolution:

Escalated immediately to orthopedic team.

Status:

escalated

Escalation Reason:

Possible wound infection.

---

# Insurance Tickets

## Ticket I-001

Patient Query:

"Does Navajeevana Ortho Hospitals accept Star Health Insurance?"

Category:

insurance

Resolution:

Yes. Eligible Star Health Insurance policies are accepted subject to authorization approval and policy terms.

Status:

auto_resolved

---

## Ticket I-002

Patient Query:

"Can I use my Aarogyasri card for knee replacement surgery?"

Category:

insurance

Resolution:

Patients may be eligible under Dr. YSR Aarogyasri depending on applicable package coverage, authorization approval, and government guidelines.

Status:

auto_resolved

---

## Ticket I-003

Patient Query:

"My cashless request was rejected. What should I do?"

Category:

insurance

Resolution:

Escalated to billing and insurance desk for review.

Status:

escalated

Escalation Reason:

Insurance authorization dispute.

---

# Emergency Tickets

## Ticket E-001

Patient Query:

"I fell from a bike and cannot move my leg."

Category:

emergency

Resolution:

Escalated immediately to emergency services.

Status:

escalated

Escalation Reason:

Possible fracture or major trauma.

---

## Ticket E-002

Patient Query:

"My father fell and cannot stand up."

Category:

emergency

Resolution:

Escalated immediately to emergency services.

Status:

escalated

Escalation Reason:

Fall with mobility loss.

---

## Ticket E-003

Patient Query:

"I have severe chest pain after surgery."

Category:

emergency

Resolution:

Escalated immediately. Patient advised to seek emergency medical attention.

Status:

escalated

Escalation Reason:

Chest pain detected.

---

# Complaint Tickets

## Ticket C-001

Patient Query:

"I am unhappy with the delay in receiving my insurance approval."

Category:

complaint

Resolution:

Escalated to patient care coordinator.

Status:

escalated

---

## Ticket C-002

Patient Query:

"I want to submit a complaint regarding my hospital experience."

Category:

complaint

Resolution:

Escalated to patient relations team.

Status:

escalated

---

# Teleconsultation Tickets

## Ticket TC-001

Patient Query:

"Can I review my follow-up appointment through video consultation?"

Category:

teleconsultation

Resolution:

Teleconsultation may be available for eligible follow-up visits depending on doctor availability.

Status:

auto_resolved

---

## Ticket TC-002

Patient Query:

"Can you explain my MRI report during a video consultation?"

Category:

report

Resolution:

Escalated to doctor. Medical report interpretation is not provided by the AI system.

Status:

escalated

Escalation Reason:

MRI interpretation request.
