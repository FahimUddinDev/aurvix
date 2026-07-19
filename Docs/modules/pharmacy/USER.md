# Pharmacy Management & POS — User Guide

This guide details how to dispense e-prescriptions, operate the keyboard-first POS counter, adjust drawer shifts, and handle returns.

---

## 1. Dispensing e-Prescriptions
1. Navigate to the **Dispense Queue** (`/pharmacy`).
2. Select a patient prescription from the queue.
3. Review items and their suggested stock batches. The system auto-selects batches with the earliest expiry dates (FEFO).
4. Enter optional counseling remarks.
5. Click **Confirm Dispensed & Release** to log completion.

---

## 2. Operating the POS cash Counter
To serve walk-in customers or sell OTC (over-the-counter) drugs, navigate to `/pharmacy/pos`.

### POS Keyboard Hotkeys
* `F1`: Focus search input to quickly scan or lookup medicines.
* `F2`: Retrieve standard product lists.
* `F4`: Park/Hold active cart. (Gives a Hold ID code to serve the next customer).
* `F8`: Quick checkout and pay.
* `F9`: Retrieve held carts by typing the Hold ID.

### Split Payments Checkout
POS checkouts support split payment methods:
1. In the right panel, enter the amount paid in **Cash**, **bKash** (mobile banking), or **SSL Card**.
2. Type in the transactions references (for card/mobile).
3. The sum of all methods must match or exceed the invoice total to unlock **Complete Checkout**.

---

## 3. Managing Cashier shifts
Cashiers cannot process checkout transactions unless they have an active open shift drawer.
1. Navigate to `/pharmacy/pos/shift`.
2. **Open Shift**: Type starting float funds and click **Unlock Cash Register**.
3. **Close Shift**:
   * Review expected drawer counts (opening cash + expected cash sales + digital sales).
   * Type counted physical cash in drawer.
   * Review calculated drawer variance.
   * Click **Close shift & Log reconciliation** to save.

---

## 4. Processing returns
1. Navigate to `/pharmacy/pos/returns`.
2. Search invoice using the Invoice ID.
3. Check the items and specify the quantities returned.
4. Select **Return Destination**:
   * *Restock*: Adds stock back to the original batch quantity.
   * *Discard*: Adjusts stock ledger as damaged waste.
5. Click **Confirm Return** to log refund.
