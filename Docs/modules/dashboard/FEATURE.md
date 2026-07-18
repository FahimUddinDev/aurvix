# Dashboard Module

## Overview

The Dashboard module acts as the home hub for authenticated users in the Aurevix Hospital Management
System. It renders real-time KPI metrics, pending clinical tasks, ward occupancy details, and
activity feeds tailored dynamically to the logged-in user's role.

## User Stories

- **As an Admin**, I want to see hospital revenue trends, ward occupancy summaries, and recent
  activity logs, so that I can monitor operations and system health.
- **As a Doctor**, I want to see my today's appointments, active patient count, and pending lab
  results to review, so that I can organize my consultations.
- **As a Pharmacist**, I want to see pending prescriptions to dispense and low drug stock warnings,
  so that I can manage pharmacy inventory.
- **As a Nurse**, I want to see ward bed boards and vitals checklists, so that I can execute patient
  care schedules.
- **As a Lab Tech**, I want to see pending laboratory samples and tat metrics, so that I can
  organize sample testing.

## Features List

- Role-specific KPI metrics (using `dashboardStats` query parameters).
- Recent activity feeds.
- Conditional component layouts matching user authorization scopes (Admin, Doctor, Pharmacist,
  Nurse, Lab Tech, etc.).
- Low stock alerts and reorder warning tables.
- Ward-wise bed occupancy progress indicators.
- Patient followup lists and CRM reminder logs.

## Workflows

### Dashboard Load Workflow

1. User logs in.
2. System fetches user roles from auth state.
3. Dashboard queries `dashboardStats` and supplementary queries (e.g. `recentActivities`,
   `bedOccupancySummary`) via TanStack Query.
4. UI loads and displays cards and grid widgets matching the user's role.

## Business Rules

- KPIs and charts must reflect live database operations (revenue, active bed allocations, low
  inventory numbers).
- UI layouts must automatically fall back to standard logs if a user has an unmapped system role.

## Related Modules

- **Auth & RBAC**: Provides active roles (`user.role`) for widget loading gates.
- **Laboratory / Pharmacy / Billing**: Supplies raw metrics to the background query resolver.

## SRS Mapping

- **FR-DASH.1**: Dynamic role-based layouts.
- **FR-DASH.2**: Action items queue (Labs, Prescriptions).
- **FR-DASH.3**: Real-time KPI summaries.
