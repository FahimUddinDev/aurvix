# Wards, Beds & Inpatient Admission Module

## Overview
The Wards, Beds & Inpatient Admission module controls patient hospitalizations, bed occupancy mappings, cleaning workflows, room transfers, and automatic daily ward charge updates.

---

## User Stories
* **As a Nurse**, I want to view the real-time wards board so that I can identify empty beds.
* **As a Nurse**, I want to admit a patient to an available bed and record admission notes.
* **As a Physician**, I want to transfer a patient to a different ward (e.g., General Ward to ICU).
* **As a Housekeeper**, I want to see beds marked as `UNDER_CLEANING` and reset them to `AVAILABLE` after sanitization.

---

## Features List
* **Interactive Wards Board**: Grid view of beds in all active wards (General, Semi-Private, ICU) showing occupancy and floor.
* **Bed Transfer Tracker**: Real-time room transfer logging with validation locks to prevent double bed bookings.
* **Cleaning Workflow**: Discharging a patient automatically flags beds for cleaning.
* **Discharge Billing Compilation**: Calculates inpatient stays and appends room charges to final patient invoices.
