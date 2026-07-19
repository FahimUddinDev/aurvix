# Doctor & Department Management Module

## Overview
The Doctor & Department Management module manages the registry of medical professionals within the hospital. It handles doctor profiles, BMDC registration numbers, specializations, primary and secondary department assignments, consultation fee structures, and recurring weekly schedule templates.

This module acts as the core scheduler configuration source, which is consumed by the Appointment & Queue Management module to determine slot availability.

---

## User Stories

* **As an Admin**, I want to register a doctor profile for an existing system user so that they can begin seeing patients.
* **As an Admin**, I want to configure the weekly consultation schedule and fees for a doctor so that they are available for bookings.
* **As a Receptionist**, I want to search doctors by name, department, or specialization to guide patient queries and book appointments.
* **As a Doctor**, I want to view my profile details and configured schedules to verify my clinic hours.

---

## Features List
* **Doctor Profile Registry**: Capture name, email, phone, BMDC registration, specialization, qualifications, and experience.
* **Bilingual Bios**: Provide professional bio in English and Bengali (`bio`, `bioBn`) for consumer and patient portal display.
* **Multi-Department Scoping**: Bind doctors to hospital departments.
* **Weekly Schedule Planner**: Setup recurring clinic hours (day, start time, end time, slot duration, and max patients capacity).
* **Consultation Fee Management**: Configure default and customized fees per doctor and department.
* **Availability Check API**: Verify slot capacity dynamically.

---

## Business Rules & Constraints
1. **Uniqueness**: A system user (`User`) can have at most one active `DoctorProfile`.
2. **Overlap Restriction**: Weekly schedules for the same doctor cannot have overlapping time frames on the same day.
3. **BMDC Verification**: BMDC registration number is optional but strongly recommended for clinical integrity.
4. **Localization**: Display department names in the user's preferred language (English or Bengali).
