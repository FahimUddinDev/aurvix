# Patient Module — User Guide

## Overview

The Patient module is used by receptionists, doctors, and nurses to register new patients, search
existing records, and view clinical history timelines.

## Step-by-Step Instructions

### Searching Patient Records

1. Go to **Patients** in the sidebar.
2. In the search box, enter the patient's name, phone number, National ID (NID), or UHID.
3. The directory will update. Click **View Profile** to open their file.

### Registering a New Patient

1. Click **+ Register Patient** in the top header.
2. Complete the patient's demographic details:
   - Enter First/Last names in English and Bengali.
   - Input the Date of Birth and select the Gender and Blood Group.
3. Enter Contact details:
   - Input the Phone number (must follow `+880XXXXXXXXXX` format).
   - Enter email and addresses (English/Bengali).
   - Enter their National ID (NID) (10 or 17 digits).
4. Register Emergency Contacts:
   - Click **+ Add Emergency Contact**.
   - Enter name, relationship (e.g. Spouse), and contact phone.
5. Log Active Clinical Allergies:
   - Click **+ Add Allergy Record**.
   - Enter the Allergen (e.g., Penicillin), reaction notes, and severity level (Mild, Moderate,
     Severe).
6. Click **Register Patient** to save.

### Reviewing Clinical Timeline

1. Open a patient's profile page.
2. Select the **Medical History Timeline** tab.
3. Review chronological visits, billing entries, and diagnostic logs.

## Troubleshooting / FAQ

#### Why is my phone number validation failing?

All phone numbers must be entered in the international Bangladeshi format: `+880` followed by
exactly 10 digits (e.g., `+8801700000000`).

#### Can I delete a duplicate patient?

If a patient has been registered twice, contact your administrator. They can use the `mergePatients`
feature to merge both patient files, preserving all billing and consultation histories.
