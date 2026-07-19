# Radiology — Developer Guide

## Architecture
The radiology system maps outpatient scans through a simple lifecycle status (`PENDING` -> `IN_PROGRESS` -> `REPORT_UPLOADED` -> `APPROVED` / `CANCELLED`).

### Directory Structure
* Backend: `apps/api/src/modules/radiology/`
  * `radiology.resolver.ts`: GraphQL endpoint resolvers.
  * `radiology.service.ts`: State management and transaction scopes.
* Frontend: `apps/web/app/[locale]/radiology/`
  * `page.tsx`: Queue console.
  * `upload/[id]/page.tsx`: Report and PACS link uploader.
  * `review/[id]/page.tsx`: Radiologist review and print letterhead sheet.

---

## GraphQL API

### Queries
* `radiologyWorklist(status: String): [RadiologyOrder!]!`
* `radiologyOrder(id: ID!): RadiologyOrder!`
* `radiologyModalities: [RadiologyModality!]!`
* `patientRadiologyHistory(patientId: ID!): [RadiologyOrder!]!`

### Mutations
* `createRadiologyOrder(visitId: ID!, input: CreateRadiologyOrderInput!): RadiologyOrder!`
* `uploadRadiologyReport(orderId: ID!, input: UploadRadiologyReportInput!): RadiologyReport!`
* `approveRadiologyReport(orderId: ID!): RadiologyOrder!`
