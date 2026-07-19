# Laboratory Management Module

## Overview
The Laboratory Management module handles specimen tracking, sample collections, test entries, and pathologist validation sign-offs. It manages a master test catalog with Reference Range parameters.

---

## User Stories
* **As a Lab Technician**, I want to view the list of pending lab test orders so that I can collect samples and print barcodes.
* **As a Lab Technician**, I want to enter result values for collected specimens and see automatic flagging if they fall outside reference bounds.
* **As a Pathologist**, I want to review resulted worksheets and either sign-off/approve them or reject them for re-running.
* **As a Clinician**, I want to view approved lab reports directly inside the patient EMR file.

---

## Features List
* **Lab Worklist Queue**: Filterable list by status (Pending, Collected, Resulted, Approved).
* **Specimen Collection Desk**: Scans tube barcodes, prints barcodes, and updates order states.
* **Auto-Flagging Reference Engine**: Compares numeric results against age/gender-specific bounds.
* **Critical Value Alerts**: Emits events to prompt notifications when life-threatening results are logged.
* **Two-tier Sign-off Console**: Technicians input results; pathologists approve or reject.
* **Master Test Catalog**: Configurable test catalog.

---

## Business Rules & Constraints
1. **Approval Constraint**: Reports are only readable by clinical staff or patients once approved by a pathologist.
2. **Re-run Protocol**: Rejecting a result returns it to the technician worklist.
3. **Critical Value Thresholds**: Results classified as `CRITICAL_HIGH` or `CRITICAL_LOW` trigger immediate notifications to the ordering physician.
