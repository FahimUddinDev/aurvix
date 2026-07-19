# Pharmacy Management & POS — Developer Guide

## Architecture
The pharmacy system manages inventories via multi-expiry `StockBatch` sheets, tracks cashier cash drawer shifts (`PharmacyShift`), and registers point of sale transactions (`PharmacySale`).

### Directory Structure
* Backend: `apps/api/src/modules/pharmacy/`
  * `pharmacy.resolver.ts`: GraphQL query and mutation resolvers.
  * `pharmacy.service.ts`: POS checkout validation, stock batch management, return reversals.
* Frontend: `apps/web/app/[locale]/pharmacy/`
  * `page.tsx`: Prescription dispense worklist.
  * `pos/page.tsx`: Keyboard-first POS sales workspace.
  * `pos/shift/page.tsx`: Registers drawer open/close.
  * `pos/returns/page.tsx`: Sale return sheets.
  * `stock/page.tsx`: Inventory and expiry warnings dashboard.

---

## FEFO Batch Auto-Selection & Deductions
The service orders batches by `expiryDate asc` to suggest the earliest expiring items:

```typescript
  async getInventory(hospitalId: string, search?: string) {
    return this.prisma.stockBatch.findMany({
      where: { hospitalId, qty: { gt: 0 } },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }
```

---

## GraphQL API

### Queries
* `pendingPrescriptions: [Prescription!]!`
* `pharmacyInventory(search: String, category: String): [StockBatch!]!`
* `expiringMedicines(withinDays: Int!): [ExpiringMedicine!]!`
* `activePharmacyShift: PharmacyShift`
* `shiftCloseReport(shiftId: ID!): ShiftCloseReport!`
* `resumePosSale(holdId: ID!): HeldSale`
* `findPharmacySale(invoiceNo: String!): PharmacySale`

### Mutations
* `dispenseMedication(prescriptionId: ID!, items: [DispenseItemInput!]!, notes: String): PharmacyDispense!`
* `openPosShift(openingBalance: FloatScalar!): PharmacyShift!`
* `closePosShift(shiftId: ID!, actualCash: FloatScalar!, notes: String): PharmacyShift!`
* `createPosSale(input: CreatePosSaleInput!): PharmacySale!`
* `holdPosSale(patientId: ID, itemsJson: String!): HeldSale!`
* `posReturn(saleId: ID!, items: [PosReturnItemInput!]!, reason: String, isWasted: Boolean): PharmacyReturn!`
