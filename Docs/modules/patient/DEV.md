# Patient Module — Developer Guide

## Architecture

The Patient module is constructed using NestJS backend services coupled with Next.js App Router
forms. It processes NID encryptions and generates UHIDs.

## Database Schema

Prisma models in `schema.prisma`:

- **Patient**: Primary demographic model. Stores email, phone, gender, dateOfBirth, encrypted NID
  (`nidEncrypted` via PostgreSQL `pgcrypto`), and `isActive`.
- **PatientAllergy**: Stores patient drug/food/environment allergy history.
- **EmergencyContact**: Stores emergency contact details.
- **PatientDocument**: Stores references to medical attachments.

## GraphQL API Reference

### Queries

- `patients(search: String, page: Int, limit: Int): PaginatedPatients!`
  - Returns paginated listings matching keyword filters.
- `patient(id: ID!): Patient!`
  - Returns detailed profile demographics.
- `patientTimeline(id: ID!): [TimelineItem!]!`
  - Aggregates visit and billing history chronologically.

### Mutations

- `createPatient(input: CreatePatientInput!): Patient!`
  - Registers a new patient. Auto-generates a UHID and encrypts NID.
- `updatePatient(id: ID!, input: UpdatePatientInput!): Patient!`
  - Modifies patient demographics and clinical markers.
- `mergePatients(sourceId: ID!, targetId: ID!): Boolean!`
  - Deduplicates profiles.

## Zod Schemas

Located in `packages/validators/src/patient.schema.ts`:

- `createPatientSchema`: Enforces rules for names (min 2), BD phone regex, NID regex, DOB, emergency
  contacts array, and allergies array.
- `updatePatientSchema`: Partial creation schema mapping fields for edit updates.
