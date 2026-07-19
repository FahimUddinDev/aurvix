# Laboratory Management — User Guide

This guide details how to track lab orders, collect specimens, input results, and approve report sheets.

---

## 1. Navigating the Lab Worklist
1. Open the **Lab Worklist** dashboard (`/laboratory`).
2. The page loads four progress queues:
   * **Pending Collection**: Orders placed by EMR where the blood/fluid sample has not yet been collected.
   * **Collected / Testing**: Specimens successfully checked in and currently undergoing processing.
   * **Resulted / Approvals**: Result values successfully entered, awaiting review by the pathologist.
   * **Approved Reports**: Finalized report sheets signed-off and archived.

---

## 2. Collecting Specimens
1. From the **Pending Collection** tab, click **Collect Specimen** on the respective patient's row.
2. Select the **Specimen Sample Type** (e.g. Whole Blood, Serum, Urine).
3. Scan the label barcode on the test tube. (You can click *Generate Barcode* to auto-assign a test label for seeding).
4. Click **Confirm Specimen Collected**. The order automatically advances to the *Collected / Testing* tab.

---

## 3. Entering Lab Results
1. From the **Collected / Testing** tab, click **Enter Result Values** on the patient's row.
2. Type the measured values into the **Result Value** fields for each requested test.
3. Reference ranges are displayed on the left column.
4. Input optional clinical remarks.
5. Click **Save & Submit Values**. The system analyzes ranges, auto-tags any abnormal/critical flags, and routes the report to the *Resulted / Approvals* queue.

---

## 4. Pathologist Review & Approval
1. From the **Resulted / Approvals** tab, click **Review & Approve** on the patient's row.
2. The system displays the worksheet. Any value outside normal parameters will flag:
   * Yellow badge: `ABNORMAL` value.
   * Red flashing badge: `CRITICAL_HIGH` or `CRITICAL_LOW` value (requires immediate physician alerting).
3. **Approve**: Click *Sign-Off & Approve Report* to save the final sheet.
4. **Reject**: Click *Reject Report*, type the re-run explanation, and submit. The order returns to the technician worklist.
