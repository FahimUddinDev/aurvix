# Laboratory Management — Developer Guide

## Architecture
The laboratory system operates a multi-state order workflow (`PENDING` -> `SAMPLE_COLLECTED` -> `RESULTED` -> `APPROVED` / `REJECTED`).

### Directory Structure
* Backend: `apps/api/src/modules/laboratory/`
  * `laboratory.resolver.ts`: GraphQL queries/mutations.
  * `laboratory.service.ts`: CRUD operations, reference checks, status transitions.
* Frontend: `apps/web/app/[locale]/laboratory/`
  * `page.tsx`: Lab Worklist queue dashboard.
  * `collect/[id]/page.tsx`: Sample collection & barcode registrars.
  * `results/[id]/page.tsx`: Worksheets and pathologists approval screen.
  * `catalog/page.tsx`: Reference catalog.
  * `reports/page.tsx`: Approved reports list.

---

## Reference Range Analyzer
The service parses normal ranges (like `"12.0 - 16.0"`) and matches numeric entries:

```typescript
  private calculateFlag(valueStr: string, test: any, gender: string): ResultFlag {
    const rangeStr = gender === 'FEMALE' ? test.normalRangeFemale : test.normalRangeMale;
    if (!rangeStr) return ResultFlag.NORMAL;

    const val = parseFloat(valueStr);
    if (isNaN(val)) return ResultFlag.NORMAL;

    const match = rangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = parseFloat(match[2]);
      if (val < min) {
        if (val < min * 0.7) return ResultFlag.CRITICAL_LOW;
        return ResultFlag.ABNORMAL;
      }
      if (val > max) {
        if (val > max * 1.3) return ResultFlag.CRITICAL_HIGH;
        return ResultFlag.ABNORMAL;
      }
    }
    return ResultFlag.NORMAL;
  }
```

---

## GraphQL API

### Queries
* `labWorklist(status: String, priority: String): [LabOrder!]!`
* `labOrder(id: ID!): LabOrder!`
* `labTestCatalog(category: String, search: String): [LabTestCatalog!]!`
* `patientLabHistory(patientId: ID!): [LabOrder!]!`

### Mutations
* `collectSample(orderId: ID!, input: CollectSampleInput!): LabSample!`
* `enterLabResult(orderId: ID!, results: [LabResultValueInput!]!): [LabResult!]!`
* `approveLabResult(orderId: ID!): LabOrder!`
* `rejectLabResult(orderId: ID!, reason: String!): LabOrder!`
* `flagCriticalValue(orderId: ID!): LabOrder!`
