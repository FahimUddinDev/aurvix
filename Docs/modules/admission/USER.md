# Wards, Beds & Inpatient Admission — User Guide

This guide details how to check bed status, admit patients, manage room transfers, clean beds, and process patient discharges.

---

## 1. Navigating Wards Board
Navigate to `/wards` to view active inpatient floors:
1. Wards are grouped by name (e.g. VIP Cabin, ICU, General OPD).
2. Each bed card displays a colored status badge:
   * **AVAILABLE** (Green): Free to occupy. Click card to admit patient.
   * **OCCUPIED** (Blue): Occupied by inpatient.
   * **UNDER CLEANING** (Amber): Needs housekeeping before reuse.

---

## 2. Admitting Patients
1. Navigate to `/wards/admit` or click any **AVAILABLE** bed on the Wards Board.
2. In the patient search input, type patient Name or **UHID** and select them.
3. Confirm the selected Inpatient Ward and Bed ID.
4. Add optional **Admission Notes** (diagnosis, condition, physician instructions).
5. Click **Admit & Occupy Bed**.

---

## 3. Bed Room Transfers
If a patient requires ward transfers (e.g., condition worsened and transferred to ICU):
1. Navigate to `/wards/admissions`.
2. Click **Room Transfer** next to the patient name.
3. Select an available bed from the dropdown list.
4. Click **Go**. The old bed is automatically set to `UNDER_CLEANING`, and the new bed is marked as `OCCUPIED`.

---

## 4. Resetting Cleaning Status
When a bed is vacated:
1. Navigate to `/wards` map.
2. Locate the bed marked **UNDER CLEANING**.
3. Once sanitization is completed, click **Clean** inside the bed card.
4. The bed will reset to **AVAILABLE** immediately.

---

## 5. Discharging Patients
1. Navigate to `/wards/admissions`.
2. Click **Discharge** next to the patient name.
3. Enter discharge notes (routing advice, medication prescriptions).
4. Confirm discharge. The daily room billing item is automatically calculated and appended to the patient's pending billing invoice.
