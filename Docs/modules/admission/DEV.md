# Wards, Beds & Inpatient Admission — Developer Guide

## Architecture
The admissions module tracks inpatient records using the `Admission` model, updating `Bed` status states and publishing events when patients are discharged.

### Directory Structure
* Backend: `apps/api/src/modules/admission/`
  * `admission.resolver.ts`: GraphQL query and mutation endpoints.
  * `admission.service.ts`: Patient check-ins, transfer rules, cleaning status resets.
* Frontend: `apps/web/app/[locale]/wards/`
  * `page.tsx`: Wards occupancy grid display.
  * `admissions/page.tsx`: Inpatients admissions ledger.
  * `admit/page.tsx`: Bed check-in form.

---

## Bed Conflict Validation Locks
To prevent double occupancy bookings:

```typescript
  async admitPatient(hospitalId: string, input: any, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findUnique({ where: { id: bedId } });
      if (!bed || bed.status !== BedStatus.AVAILABLE) {
        throw new Error('Selected bed is not available for occupancy.');
      }
      // Sets occupied & logs admission
    });
  }
```

---

## GraphQL API

### Queries
* `wards: [Ward!]!`
* `beds(wardId: ID, status: String): [Bed!]!`
* `admissions(status: String, search: String): [Admission!]!`

### Mutations
* `admitPatient(input: AdmitPatientInput!): Admission!`
* `transferPatient(admissionId: ID!, bedId: ID!): Admission!`
* `dischargePatient(admissionId: ID!, notes: String): Admission!`
* `markBedAvailable(bedId: ID!): Bed!`
