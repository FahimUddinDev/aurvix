# Billing & Payments — User Guide

This guide details how to manage patient invoices, add service charges, process cash/digital payments, and print receipts.

---

## 1. Managing Invoice Ledger
To view patient invoices, navigate to `/billing`.
1. **Tabs Filters**: Filter invoices by status:
   * *All*: Displays all drafts, unpaid, and settled invoices.
   * *Unpaid*: Outstanding invoices with remaining due balances.
   * *Partially Paid*: Invoices with partial deposits.
   * *Settled*: Fully paid bills.
2. **Search**: Find invoices quickly by searching the **Bill Number** or patient **UHID**.

---

## 2. Adding Custom Service Charges
If a patient has custom procedural costs or extra ward supplies:
1. Open the invoice details page (`/billing/[id]`).
2. In the right panel under **Add Custom Charge**, enter:
   * *Item Description* (e.g. "IV Cannulation Procedure")
   * *Unit Price* (BDT) and *Quantity*
3. Click **Add Charge to Bill**. The subtotal, tax amount, and due balance will automatically update.

---

## 3. Reconciling Payments & Checkout
1. Open the invoice details page.
2. In the right panel under **Process Receipt Settlement**:
   * Type the **Payment Amount**.
   * Select **Payment Method**: Cash Drawer, bKash Sandbox, or SSLCommerz Sandbox.
   * Enter the transaction reference code (e.g. trxID or card approval code).
3. Click **Process Payment**.

### Digital Payment Gateway Checkout
To allow online card/mobile checkouts:
1. Click **Initialize SSLCommerz Gateway Link** under the checkout panel.
2. A mockup checkout redirect link will be displayed.
3. Open the link to proceed with simulated payment gateways.

---

## 4. Printing Patient Invoices
1. Open the invoice details page.
2. Click **Print Invoice Receipt** in the top right.
3. The browser print preview will automatically load, formatting the page as a clean hospital print layout (hiding all action inputs and buttons).
