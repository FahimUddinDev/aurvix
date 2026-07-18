# Patient Registration & Management

## Overview

The Patient Registration and Management module controls demographic entries, identification checks,
clinical warnings (allergies), and emergency contact records. It generates unique identification
codes (UHID) and acts as the clinical record folder for all inpatient (IPD) and outpatient (OPD)
services.

## User Stories

- **As a Receptionist**, I want to search for existing patients by name, phone, NID, or UHID, so
  that I can prevent creating duplicate records.
- **As a Receptionist**, I want to register a new patient with their English/Bengali names, date of
  birth, contact details, and National ID (NID), so that the patient card has complete demographics.
- **As a Receptionist**, I want to record emergency contact names and phone numbers, so that the
  clinic can notify family members in emergencies.
- **As a Doctor or Nurse**, I want to record active patient drug/food allergies and reactions, so
  that all subsequent prescription orders can prevent critical medical conflicts.
- **As a Practitioner**, I want to view a patient's chronological history timeline, so that I can
  review their previous consultations, lab tests, and billing invoices.

## Features List

- Fuzzy search directory (PostgreSQL trigram search by name/phone/NID/UHID).
- Bilingual demographic name and address registration (EN / BN).
- National ID (NID) encrypted at rest (via pgcrypto).
- Dynamic lists for emergency contacts.
- Clinical allergy registers (Allergen name, reaction notes, and severity levels).
- Chronological medical timeline events list.

## Workflows

### Patient Registration Workflow

1. Receptionist searches directory to verify the patient is not already registered.
2. If new patient, clicks "Register Patient".
3. Enters demographics and optional NID/allergies/emergency contact rows.
4. On submit, validators verify formats (`+880` phone, NID length).
5. System auto-generates UHID based on hospital config and saves the record.

## Business Rules

- Patients must have unique phone numbers unless explicitly linked.
- UHID format is generated automatically by branch configuration (e.g. `AVX-DHK-000001`).
- All clinical modules (OPD Consultations, Lab Orders, Billing) are linked to a single unique UHID.

## Related Modules

- **Settings & Config**: UHID prefix patterns are read from hospital configurations.
- **OPD / Appointments**: Booking appointments requires selecting an active UHID.

## SRS Mapping

- **FR-PAT.1**: Unified Health ID (UHID) auto-generation.
- **FR-PAT.2**: Demographic data capture (EN/BN).
- **FR-PAT.3**: Emergency contacts.
- **FR-PAT.4**: Allergy warnings.
- **FR-PAT.5**: Chronological patient timeline.
