# Doctor & Department Management — Developer Guide

## Architecture Overview
The module uses a NestJS backend (GraphQL Code-First) and Next.js frontend, interacting with PostgreSQL via Prisma.

### Directory Structure
* Backend: `apps/api/src/modules/doctor/`
  * `doctor.resolver.ts`: GraphQL query/mutation handlers
  * `doctor.service.ts`: Prisma CRUD database operations
* Frontend: `apps/web/app/[locale]/(dashboard)/doctors/`
  * `page.tsx`: Directory grid and creation modal
  * `[id]/page.tsx`: Doctor profile detail view
  * `[id]/schedule/page.tsx`: Weekly schedule slot editor

---

## Database Schema
Models defined in `schema.prisma`:

### DoctorProfile
* `id` (UUID v7 PK)
* `hospitalId` (UUID FK)
* `userId` (UUID Unique FK)
* `departmentId` (UUID FK)
* `bmdcNumber` (String)
* `specialization` (String)
* `qualification` (String)
* `experience` (Int)
* `consultationFee` (Decimal)

### DoctorSchedule
* `id` (UUID v7 PK)
* `doctorId` (UUID FK)
* `dayOfWeek` (Int: 0=Sunday, 6=Saturday)
* `startTime` (String: "HH:MM")
* `endTime` (String: "HH:MM")
* `slotDurationMin` (Int)
* `maxPatients` (Int)

---

## GraphQL API Reference

### Queries
* `doctors(filters: DoctorFiltersInput, page: Int, limit: Int): PaginatedDoctors!`
* `doctor(id: ID!): DoctorProfile!`
* `doctorSchedule(id: ID!): [DoctorSchedule!]!`
* `doctorFees(id: ID!): [DoctorFee!]!`
* `doctorAvailability(id: ID!, date: String!): Boolean!`

### Mutations
* `createDoctor(input: CreateDoctorInput!): DoctorProfile!` (Required role: `SUPER_ADMIN`, `ADMIN`)
* `updateDoctor(id: ID!, input: UpdateDoctorInput!): DoctorProfile!` (Required role: `SUPER_ADMIN`, `ADMIN`)
* `updateSchedule(id: ID!, slots: [ScheduleSlotInput!]!): [DoctorSchedule!]!` (Required role: `SUPER_ADMIN`, `ADMIN`)

---

## Validation Schemas (Zod)
Shared schemas in `packages/validators/src/doctor.schema.ts`:
* `createDoctorSchema`: Validates creation input.
* `scheduleSlotSchema`: Validates day of week (0-6) and time format (`HH:MM`).
