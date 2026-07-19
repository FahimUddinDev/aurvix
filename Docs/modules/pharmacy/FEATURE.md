# Pharmacy Management & POS Module

## Overview
The Pharmacy Management & POS module handles stock batches, FEFO (First Expired, First Out) inventory auto-allocation, e-prescription fulfillment, walk-in cash sales, split checkouts, returns with stock reversals, and end-of-shift audits.

---

## User Stories
* **As a Pharmacist**, I want to view active doctor prescriptions so that I can dispense medicines and allocate expiring batches.
* **As a Cashier**, I want to open a cash drawer shift with a starting balance to serve walk-in customers.
* **As a Cashier**, I want to use keyboard hotkeys (`F1`, `F4`, `F8`, `F9`) in the POS to checkout orders or park carts.
* **As a Cashier**, I want to process returns and declare whether returned items should be restocked or discarded.

---

## Features List
* **E-Prescription Dispense Desk**: Pharmacist queue showing active prescriptions and auto-loading matching batches.
* **Keyboard-First POS Terminal**: Fast walk-in sales counter supporting barcode inputs.
* **FEFO Auto-Allocations**: Pulls inventory from earliest-expiry batches first.
* **Hold & Resume (Redis-Mocked)**: Park active carts and resume later.
* **Split Payments Checkout**: Supports cash, card, and mobile banking within a single sale.
* **Shift Drawer Reconciliation**: Reconciles expected payments against actual drawer cash.
* **Post-Sale Returns**: Reverses inventory levels on return inspection.
