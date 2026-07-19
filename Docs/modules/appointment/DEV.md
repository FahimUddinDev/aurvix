# Appointment & Queue Management — Developer Guide

## Architecture
This module manages appointment scheduling and active outpatient clinic queue lists. Real-time updates are published via NestJS event emitter bridges to GraphQL Subscriptions.

### Directory Structure
* Backend: `apps/api/src/modules/appointment/`
  * `appointment.resolver.ts`: GraphQL queries, mutations, and PubSub subscription channels.
  * `appointment.service.ts`: Prisma transactions, slot generation, wait times, check-ins, and event emission.
* Frontend: `apps/web/app/[locale]/(dashboard)/appointments/`
  * `page.tsx`: Booking list directory.
  * `new/page.tsx`: Scheduling slot form.
  * `queue/page.tsx`: Desk clerk active board.
  * `calendar/page.tsx`: Monthly planner.
* Frontend TV Board: `apps/web/app/[locale]/queue-display/page.tsx`
  * Standalone full-screen TV view with 3s refresh intervals.

---

## GraphQL API

### Queries
* `availableSlots(doctorId: ID!, date: String!): [AvailableSlot!]!`
* `availableDoctors(departmentId: ID!, date: String!): [AvailableDoctor!]!`
* `myAppointments(patientId: ID, status: String, page: Int, limit: Int): PaginatedAppointments!`
* `appointmentDetails(id: ID!): Appointment!`
* `todayQueue(doctorId: ID!): [Appointment!]!`

### Mutations
* `createAppointment(input: CreateAppointmentInput!): Appointment!`
* `rescheduleAppointment(input: RescheduleInput!): Appointment!`
* `cancelAppointment(input: CancelInput!): Appointment!`
* `checkInPatient(appointmentId: ID!): Appointment!`
* `callNextPatient(doctorId: ID!): Appointment!`
* `skipPatient(appointmentId: ID!, reason: String!): Appointment!`

### Subscriptions
* `queueStatus(doctorId: ID!): QueueToken!` (WebSocket channel)
* `queueDisplay(departmentId: ID!): QueueDisplayData!` (WebSocket channel)

---

## Events & Real-time Integration
The service emits local events using `@nestjs/event-emitter`:
1. `appointment.booked`: Dispatched on new bookings.
2. `queue.status`: Dispatched when a patient's position in the queue advances.
3. `queue.display`: Dispatched when the called/waiting tokens list in the lobby TV display changes.

`AppointmentResolver` captures these events using `@OnEvent()` decorators and forwards the payloads to GraphQL Subscription PubSub channels.
