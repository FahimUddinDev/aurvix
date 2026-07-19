# Billing & Payments — Developer Guide

## Architecture
The billing module tracks clinical charges via `BillLineItem` entries linked to a master `Bill`, logging settlements within `Payment` ledger records.

### Directory Structure
* Backend: `apps/api/src/modules/billing/`
  * `billing.resolver.ts`: GraphQL query and mutation endpoints.
  * `billing.service.ts`: Invoice compiles, line item calculators, payment checkouts.
* Frontend: `apps/web/app/[locale]/billing/`
  * `page.tsx`: Billing invoices ledger worklist.
  * `[id]/page.tsx`: Invoice checkout workspace & print sheet.

---

## Automated Compilation via Event Listening
The billing service subscribes to event triggers to compile invoices dynamically:

```typescript
  @OnEvent('consultation.completed')
  async handleConsultationCompleted(payload: {
    visitId: string;
    patientId: string;
    doctorId: string;
    hospitalId: string;
  }) {
    // Looks up doctor fee and creates a draft bill
  }
```

---

## GraphQL API

### Queries
* `bills(status: String, search: String): [Bill!]!`
* `bill(id: ID!): Bill!`

### Mutations
* `createBill(input: CreateBillInput!): Bill!`
* `addLineItem(billId: ID!, input: AddLineItemInput!): Bill!`
* `removeLineItem(billId: ID!, itemId: ID!): Bill!`
* `processPayment(billId: ID!, input: ProcessPaymentInput!): Bill!`
* `initSSLCommerzPayment(billId: ID!): SSLCommerzRedirect!`
