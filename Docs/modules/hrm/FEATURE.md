# HRM - Leave & Attendance

## Overview
The HRM module provides functionality for staff clock‑in/out, leave balance tracking, leave application, and supervisor approval workflows. It integrates with the attendance timetabling system and maintains audit logs for all leave transactions.

## User Stories
- As a staff member, I can clock in/out to record attendance.
- As a staff member, I can view my leave balances and submit leave requests.
- As a supervisor, I can review pending leave requests, approve or reject them with remarks.
- As an admin, I can configure leave types and initial allocations.

## Features List
- Real‑time attendance widget.
- Leave balances dashboard with allocated, used and remaining days.
- Leave request form with validation and date range selection.
- Supervisor approvals panel with batch actions.
- Audit‑trail for all leave transactions.

## Workflows
1. Staff clocks in/out → attendance recorded.
2. Staff navigates to Leave Center → sees balances and history.
3. Staff submits a leave request → creates a pending `LeaveRequest` record.
4. Supervisor reviews pending requests → approves or rejects, updating balances accordingly.
5. System emits events for downstream notifications (e.g., email).

## Business Rules
- Leave balances are scoped to `hospitalId`.
- Leave deductions are performed inside a Prisma transaction.
- All mutations flow through `AuditInterceptor` for logging.
- Validation is enforced via shared Zod schemas on both client and server.

## Screenshots / Wireframes
N/A – UI components are implemented using shadcn/ui with a modern glassmorphism theme.

## Related Modules
- Attendance (timecard widget)
- HRM Settings (leave type configuration)
- Notifications (event‑driven alerts)

## SRS Mapping
- FR‑13.1: Staff can submit leave request – implemented in `applyLeave` mutation.
- FR‑13.2: Supervisor can approve/reject – implemented in `approveLeave` mutation.
- NFR‑13.1: Audit logging – integrated via `AuditInterceptor`.
- NFR‑13.2: Transaction integrity – Prisma transaction used.
