# Appointment & Queue Management Module

## Overview
The Appointment & Queue Management module handles patient visit bookings, scheduling, reception check-ins, and sequential token queue management. It ensures that outpatient departments (OPD) run smoothly, providing receptionist dashboards and lounge TV displays.

All booking endpoints are designed to be public-facing-ready, preparing the application for the Phase 2 Patient Mobile App.

---

## User Stories

* **As a Patient / Receptionist**, I want to view a doctor's open slots for a specific date and book an appointment.
* **As a Receptionist**, I want to search appointments, check-in patients upon arrival, print tokens, and manage waiting lists.
* **As a Lounge Patient**, I want to see the active called token and the upcoming queue on a full-screen TV display.
* **As a Doctor**, I want to call the next checked-in patient or skip no-shows from my dashboard.

---

## Features List
* **Available Slot Calculator**: Computes open time slots based on daily templates and existing bookings.
* **Sequential Token Dispatch**: Generates sequential tokens daily (e.g. `T-001`, `T-002`) to track the patient's queue placement.
* **Receptionist Check-In desk**: Updates status to `CHECKED_IN` and timestamps arrival.
* **Lounge TV Board**: Display dashboard showing *Now Serving* and *Up Next* tickets.
* **Active Queue Board**: Control console for calling next patients or skipping no-shows.
* **Appointment Calendar**: Monthly/weekly calendar visualization for all scheduled bookings.

---

## Business Rules & Constraints
1. **Daily Reset**: Tokens reset daily per doctor to `T-01`.
2. **Double Booking**: No two active appointments can share the same doctor, date, and start time.
3. **Wait Time Estimation**: Waiting times are estimated using `Position * 15 minutes` (average consultation duration).
4. **Transition Constraints**: An appointment must be `CHECKED_IN` before it can be called `IN_PROGRESS`.
