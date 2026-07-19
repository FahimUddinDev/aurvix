# Radiology Module

## Overview
The Radiology module manages imaging scan worklists (such as X-Rays, CT Scans, MRI scans), radiographer report findings uploads, and consultant radiologist validation sign-offs.

---

## User Stories
* **As a Radiographer**, I want to view my list of pending scan orders so that I can schedule and complete imaging scans.
* **As a Radiographer**, I want to enter clinical findings, impressions, and log PACS image links.
* **As a Radiologist**, I want to review reports entered by radiographers and sign them off.
* **As a Physician**, I want to view approved imaging results in the patient EMR folders.

---

## Features List
* **Imaging Worklist**: Categorized queue displaying orders by states (Pending, Uploaded/Review, Approved).
* **Worksheet Editor**: Form fields to log findings narratives, diagnostic impressions, and PACS links.
* **Radiologist Approval Panel**: Official signature sign-off sheet with browser-print controls.
* **Hospital Letterhead Print Out**: Formal print layout containing patient metadata, modalities, clinical findings, and stamp signatures.

---

## Business Rules & Constraints
1. **Approval Constraint**: Scans and reports are only visible to general practitioners or patients after a certified radiologist approves them.
2. **Clinical Verification**: Modality pricing must match the billing catalog when ordered.
