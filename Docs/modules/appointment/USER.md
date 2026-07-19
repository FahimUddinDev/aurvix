# Appointment & Queue Manager — User Guide

This guide describes how to book patient appointments, run daily outpatient clinics, and operate lounge TV display boards in the Aurevix HMS.

---

## 1. Booking an OPD Appointment
1. Navigate to **Appointments** in the left sidebar under the *Clinical* section.
2. Click **+ Book Appointment** in the top right.
3. **Select Patient**: Type the patient's name, phone, or UHID (must be at least 3 characters) to search and select them.
4. **Choose Department & Doctor**: Select the clinic department first, then choose a consulting doctor.
5. **Pick Timing Slot**: Select a date. If schedules exist, click on one of the available slot buttons (slots highlighted in green are open; crossed-out slots are already booked).
6. Enter a brief description under **Chief Complaint** (e.g. chest distress, back checkup).
7. Click **Confirm Appointment**. The system will save the record and dispatch a sequential token number (e.g. `T-04`).

---

## 2. Managing the Clinic Queue
1. Navigate to **Appointments > Active Queue Board** (or go to `/[locale]/appointments/queue`).
2. Select the doctor from the dropdown list. The page will load three columns:
   * **Now Consulting**: The patient currently called inside the doctor's chamber.
   * **Waiting Lounge**: Patients who have arrived and checked-in.
   * **Staged / Not Arrived**: Patients who have booked slots but have not yet registered their arrival.
3. When a patient arrives at the desk, click **Check-In** next to their name in the main bookings list. They will instantly move into the *Waiting Lounge* column.
4. When the doctor is ready for the next patient, click **🔔 Call Next Patient** in the top control bar. The system will:
   * Mark the current patient's visit as completed.
   * Advance the queue by moving the next waiting token to *Now Consulting*.
   * Broadcast the update live to the lounge TV.
5. If a patient does not show up after several calls, click **Skip** next to their token in the board and enter a reason.

---

## 3. Lounge TV Display System
1. Open a web browser on the waiting area TV screens and navigate to:
   `/[locale]/queue-display`
2. Select the respective department from the dropdown list.
3. The board launches full-screen in a high-contrast dark theme, displaying:
   * **Now Consulting**: Large green called tokens with doctor names.
   * **Up Next**: The next 5 upcoming tokens waiting in the lounge.
4. The board automatically refreshes in real-time to alert patients.
