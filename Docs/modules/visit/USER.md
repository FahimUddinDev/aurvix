# Physician Consultation & EMR — User Guide

This guide details how a consulting physician manages their daily queue, registers clinical vitals, writes clinical SOAP notes, selects diagnoses, and compiles electronic prescriptions in the Aurevix HMS.

---

## 1. Opening the Doctor Desk Queue
1. Log in to the physician portal.
2. Navigate to the **Physician EMR Queue** workspace (`/emr/queue`).
3. Select your name under **Doctor Context** to load your scheduled outpatient slots for today.
4. The list displays today's patients. Patients highlighted as `CHECKED_IN` are waiting in the lounge.
5. Click **Start Consultation** next to the next waiting patient's details. The system automatically creates a visit record and updates the patient's queue status.

---

## 2. Operating the SOAP Workspace
Once you start a consultation, the system launches the **Clinical Workspace**:

### A. Vitals Panel (Left)
* Review existing allergy flags (e.g. penicillin, dust).
* Enter/update vital signs: Systolic BP, Diastolic BP, Heart Rate, Temperature, and SpO2.

### B. SOAP Notes & Diagnosis Panel (Center)
* **Subjective**: Type the symptoms or chief complaints described by the patient.
* **Objective**: Document examination findings.
* **Assessment**: Describe clinical diagnosis opinions.
* **Plan**: Log recommended follow-ups or laboratory instructions.
* **ICD-10 Coded Diagnosis**: Type in the lookup field (e.g. search "J45" or "Asthma") to find standardized codes. Click a code to add it to the list. Assign the **Primary** flag to the chief medical condition (other conditions default to secondary).

### C. Prescription Pad (Right)
* Search generic or brand medications using the medication search input.
* Click a drug to add it to the prescription pad.
* Specify instructions: Dosage (e.g., `1+0+1`), Frequency (`after meal`), Duration (`7 days`), and quantity.

---

## 3. Finalizing the Consultation
1. When all clinical inputs, SOAP notes, and prescriptions are recorded, click **Complete & Save Consultation** in the top right.
2. The workspace will save, lock the clinical records, and trigger:
   * **Receipting**: Routes consult/procedural charges directly to the billing desk.
   * **E-Pharmacy**: Sends prescription items directly to the pharmacist pickup list.
   * **Waitlist Dispatch**: Alerts the receptionist queue board to automatically call the next patient.
