# OPD Consultation & EMR — Developer Guide

## Architecture
The consultation system bridges appointments, patients, prescriptions, and billing. Completing a consultation fires events that trigger downstream workflows (such as billing or lab routing).

### Directory Structure
* Backend Modules:
  * `apps/api/src/modules/visit/`: Visit lifecycle, vitals, SOAP notes, ICD-10 search.
  * `apps/api/src/modules/prescription/`: E-prescriptions, medicines search, drug interaction checks.
* Frontend Pages:
  * `/[locale]/emr/queue`: Physician worklist.
  * `/[locale]/emr/visit/[id]`: Interactive SOAP workspace.
  * `/[locale]/emr/patient/[id]/history`: Longitudinal EMR folder timeline.

---

## GraphQL API

### Visit Queries & Mutations
* `patientEmr(patientId: ID!): PatientEMR!`
* `searchICD10(query: String!): [ICD10Code!]!`
* `visitHistory(patientId: ID!): [Visit!]!`
* `startConsultation(appointmentId: ID!): Visit!`
* `addVitals(visitId: ID!, input: VitalsInput!): VitalSign!`
* `addDiagnosis(visitId: ID!, input: DiagnosisInput!): Diagnosis!`
* `addClinicalNote(visitId: ID!, input: ClinicalNoteInput!): ClinicalNote!`
* `completeConsultation(visitId: ID!): Visit!`

### Prescription Queries & Mutations
* `searchMedicine(query: String!): [Medicine!]!`
* `checkDrugInteractions(medicineIds: [ID!]!): [DrugInteractionWarning!]!`
* `prescriptionHistory(patientId: ID!): [Prescription!]!`
* `createPrescription(input: CreatePrescriptionInput!): Prescription!`
* `suspendPrescription(id: ID!, reason: String!): Prescription!`

---

## Downstream Integrations (Event-Driven)
When a physician completes a visit (`completeConsultation` mutation), `VisitService` emits the `consultation.completed` event:

```typescript
this.eventEmitter.emit('consultation.completed', {
  visitId,
  patientId,
  doctorId,
  hospitalId,
});
```

Other modules listen to this event:
1. **BillingModule**: Listens and compiles consultation fees + procedural costs into a pending patient bill.
2. **PharmacyModule**: Listens to `prescription.created` to populate pharmacy pickup queues.
