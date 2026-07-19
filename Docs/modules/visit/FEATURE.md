# OPD Consultation & EMR Module

## Overview
The OPD Consultation & EMR module provides clinical workflows for physicians to conduct outpatient consultations, record vital signs, document SOAP notes, search and assign ICD-10 coded diagnoses, and issue electronic prescriptions.

---

## User Stories
* **As a Physician**, I want to view my active clinic patient queue so that I can call the next patient.
* **As a Physician**, I want to record vital signs (BP, Pulse, Temp, SpO2) to monitor patient baseline values.
* **As a Physician**, I want to type Subjective, Objective, Assessment, and Plan notes (SOAP) to maintain detailed history.
* **As a Physician**, I want to search and assign primary/secondary ICD-10 diagnoses to keep records standard.
* **As a Physician**, I want to create electronic prescriptions linked directly to hospital generic/brand drug catalogs.
* **As a Medical Staff Member**, I want to view a patient's historical EMR visit timeline.

---

## Features List
* **Doctor's Consultation Queue**: Worklist of Checked-In patients ready for consultation.
* **SOAP Note Recorder**: Form sections to structure subjective, objective, assessment, and treatment plans.
* **ICD-10 Coded Diagnosis Autocomplete**: Searchable ICD-10 database linking codes directly to the visit.
* **Allergy and Drug Checking**: Warns during prescription builder if drug matches patient allergies.
* **Electronic Prescription Pad**: Dynamic Rx generator specifying drug, strength, dosage form, frequency, and instructions.
* **Patient EMR Timeline**: Unified longitudinal viewer showing past vitals, SOAP notes, and prescriptions.

---

## Business Rules & Constraints
1. **Clinical Integrity**: Only doctors can create clinical notes, diagnoses, and prescriptions.
2. **Double Consultation**: A visit must start from an active checked-in appointment.
3. **Primary Diagnosis**: Every consultation must have exactly one primary diagnosis (others are flagged secondary).
4. **Retention Safeguards**: Completed visits are locked and cannot be edited directly (for audit trails).
