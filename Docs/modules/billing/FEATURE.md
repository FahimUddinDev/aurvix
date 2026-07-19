# Billing & Payments Module

## Overview
The Billing & Payments module centralizes patient charge tracking, invoice generations, manual item adjustments, online mobile and card gateways checkouts (bKash & SSLCommerz), and printing of receipts.

---

## User Stories
* **As an Accountant**, I want to view outstanding patient due balances so that I can collect cash payments.
* **As a Cashier**, I want to add procedural adjustments or item charges directly onto a patient's bill.
* **As a Patient**, I want to pay online via mobile banking (bKash) or cards (SSLCommerz) to settle my fees.
* **As a Receptionist**, I want to print a structured invoice receipt showing billing breakdown and payments history.

---

## Features List
* **Invoice Listing & Detail View**: Centralized ledger displaying paid, unpaid, and draft invoices.
* **Line Item Registry**: Support adding or removing clinical service fees, consultations, or bed charges.
* **Automated OPD Bill Compilation**: Captures Completed Outpatient consultation events to auto-generate bills.
* **Split Digital Gateways**: Simulated API logs for bKash mobile and SSLCommerz cards redirect sandboxes.
* **Reconciliation Logs**: Payment registry capturing cashier details, references, and methods.
* **Printable Form Layouts**: Formal hospital print layouts optimized for physical printouts.
