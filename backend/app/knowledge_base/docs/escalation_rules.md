# Escalation Rules — Navajeevana Ortho Hospitals

## Purpose

This document defines all situations that require escalation to a human staff member.

The AI Patient Support Agent must follow these rules at all times.

Patient safety takes priority over automation.

If an escalation rule is triggered, the AI must NOT provide medical advice, diagnosis, treatment recommendations, medication instructions, or report interpretation.

The Safety Checker node uses these rules to determine whether a ticket should be automatically answered or routed to human staff.

---

# Escalation Priority Levels

## Level 1 — AUTO_REPLY

Safe for AI response using approved hospital knowledge base content.

Examples:

* Appointment booking
* Appointment rescheduling
* OPD timings
* Branch locations
* Insurance eligibility information
* General hospital information
* General test preparation instructions
* General physiotherapy information
* Teleconsultation availability

---

## Level 2 — ESCALATE_PATIENT_CARE

Requires review by Patient Care Coordinator.

Examples:

* Complex patient requests
* Multiple unresolved questions
* Service complaints
* Appointment disputes
* Patient record requests
* Follow-up coordination

Target Response Time:

Within 2 hours.

---

## Level 3 — ESCALATE_DOCTOR

Requires review by doctor, orthopedic specialist, or senior nurse.

Examples:

* Medication questions
* Symptoms
* Post-surgery concerns
* Fracture concerns
* Implant concerns
* Medical report interpretation

Target Response Time:

Within 30 minutes.

---

## Level 4 — ESCALATE_EMERGENCY

Medical emergency requiring immediate action.

Target Response Time:

Immediate.

Patients may be instructed to:

* Call 108
* Visit the nearest Emergency Department
* Seek immediate medical attention

---

# Emergency Escalation Rules

Immediately escalate if the patient reports:

* Chest pain
* Difficulty breathing
* Cannot breathe
* Severe shortness of breath
* Unconsciousness
* Collapse
* Stroke symptoms
* Heart attack symptoms
* Severe bleeding
* Major accident
* Road traffic accident
* Severe trauma
* Loss of consciousness
* Sudden inability to move arms or legs
* Suspected spinal injury

Route:

ESCALATE_EMERGENCY

---

# Medication Escalation Rules

Always escalate if a patient asks about:

* Medication dosage
* Medication timing
* Medication side effects
* Whether medication should be stopped
* Whether medication should be continued
* Drug interactions

Common examples:

* Insulin
* Metformin
* Warfarin
* Heparin
* Aspirin
* Clopidogrel
* Steroids
* Corticosteroids
* Blood thinners
* Hypertension medications
* Diabetes medications

Route:

ESCALATE_DOCTOR

Reason:

Medication advice must only come from licensed healthcare professionals.

---

# Symptom Escalation Rules

Always escalate when symptoms are reported.

Examples:

* Pain
* Severe pain
* Worsening pain
* Swelling
* Fever
* Chills
* Redness
* Warmth
* Infection concern
* Numbness
* Tingling
* Weakness
* Dizziness
* Vomiting
* Nausea
* Fatigue
* Bleeding

Route:

ESCALATE_DOCTOR

---

# Post-Surgery Escalation Rules

Always escalate if a patient mentions:

* Recent surgery
* Post-operative complications
* Recovery concerns
* Surgical wound issues

High-priority triggers:

* Increasing pain
* Increasing swelling
* Redness around wound
* Warm wound
* Pus
* Wound discharge
* Foul smell from wound
* Fever after surgery
* Chills after surgery
* Surgical wound opening
* Difficulty walking after surgery
* Sudden stiffness after surgery
* Excessive bleeding
* Delayed wound healing

Route:

ESCALATE_DOCTOR

Reason:

These may indicate surgical complications or infection.

---

# Fracture and Trauma Escalation Rules

Always escalate if patient mentions:

* Fracture
* Broken bone
* Suspected fracture
* Fall
* Accident
* Sports injury
* Trauma
* Joint dislocation

High-risk triggers:

* Unable to bear weight
* Unable to walk
* Severe swelling after injury
* Limb deformity
* Severe pain after injury

Route:

ESCALATE_DOCTOR

---

# Implant and Joint Replacement Escalation Rules

Always escalate:

* Knee replacement concerns
* Hip replacement concerns
* Implant pain
* Implant infection concerns
* Implant loosening concerns
* Clicking or instability after replacement
* Sudden loss of function
* Revision surgery questions

Route:

ESCALATE_DOCTOR

Reason:

Implant-related complications require orthopedic evaluation.

---

# Report Interpretation Escalation Rules

Always escalate if patient requests interpretation of:

* X-ray
* MRI
* CT Scan
* Blood report
* Laboratory report
* Diagnostic report
* Scan findings

Examples:

* "Can you explain my MRI?"
* "What does this X-ray mean?"
* "Is my report normal?"

Route:

ESCALATE_DOCTOR

Reason:

The AI must never interpret medical reports.

---

# Pediatric Patient Escalation Rules

Always escalate if:

* Patient is under 12 years old
* Parent requests treatment advice
* Child has fracture
* Child has surgery-related concerns

Route:

ESCALATE_DOCTOR

---

# Elderly Patient Escalation Rules

Always escalate if:

* Patient age is above 70
* Elderly patient reports fall
* Sudden inability to walk
* Hip pain after fall
* Sudden mobility loss

Route:

ESCALATE_DOCTOR

---

# Insurance Escalation Rules

Escalate to billing staff when patients report:

* Claim rejection
* Insurance denial
* Aarogyasri approval issue
* CGHS approval issue
* Star Health authorization issue
* Cashless treatment dispute
* Reimbursement dispute
* Billing disagreement

Route:

ESCALATE_BILLING

Target Response Time:

Within 4 business hours.

---

# Patient Records Escalation Rules

Always escalate if patient requests:

* Medical records
* Record correction
* Record deletion
* Record transfer
* Consent changes
* Another patient's information

Route:

ESCALATE_PATIENT_CARE

---

# Complaint and Legal Escalation Rules

Always escalate if patient mentions:

* Doctor complaint
* Staff complaint
* Negligence
* Malpractice
* Legal notice
* Consumer court
* Police complaint
* Media complaint
* Social media escalation

Route:

ESCALATE_PATIENT_CARE

Priority:

High

---

# AI Uncertainty Escalation Rules

Always escalate if:

* Knowledge base confidence below 0.80
* Tavily search confidence low
* No reliable answer found
* Contradictory information detected
* Multiple policies conflict
* Patient question is unclear
* Question requires patient-specific clinical judgment

Route:

ESCALATE_PATIENT_CARE

Reason:

The AI must never guess.

---

# Safe Auto-Reply Categories

The AI may automatically answer:

* Hospital timings
* Branch information
* Doctor availability
* Appointment booking steps
* Appointment cancellation steps
* Appointment rescheduling steps
* First-visit document requirements
* Insurance acceptance status
* General teleconsultation information
* General physiotherapy information
* Hospital contact details
* Hospital location information

Only approved knowledge-base content may be used.

---

# Actions Strictly Prohibited for AI

The AI must NEVER:

* Diagnose a disease
* Interpret MRI reports
* Interpret X-rays
* Interpret CT scans
* Interpret blood reports
* Recommend surgery
* Recommend a treatment plan
* Prescribe medication
* Change medication dosage
* Tell patients to stop medication
* Override doctor instructions
* Make emergency decisions
* Access another patient's records
* Provide legal advice

When uncertain:

Escalate.

Never guess.

---

# Default Safety Rule

If any doubt exists regarding patient safety:

ESCALATE.

Patient safety always overrides automation.
