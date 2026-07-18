# Dashboard Module — Developer Guide

## Architecture

The Dashboard module leverages NestJS backend resolvers which map database collections (Visits,
Wards, Beds, Medicines, LabOrders) into unified statistics. The Next.js frontend queries these
endpoints using TanStack React Query and renders widgets conditionally.

## GraphQL API Reference

### Queries

- `dashboardStats: DashboardStatsType!`
  - Fetches consolidated KPIs (revenue, appointments, bed metrics, pending prescriptions/lab
    orders).
- `recentActivities(limit: Int): [RecentActivity!]!`
  - Returns recent system action logs.
- `bedOccupancySummary: [BedOccupancySummaryItem!]!`
  - Ward occupancy breakdown.
- `pendingLabOrders(limit: Int): [DashboardLabOrder!]!`
  - Lists lab orders awaiting doctor validation.
- `pendingPrescriptions(limit: Int): [DashboardPrescription!]!`
  - Lists active pharmacy prescriptions.
- `lowStockAlerts(limit: Int): [DashboardInventoryItem!]!`
  - Reorder safety stock thresholds warnings.
- `upcomingFollowUps(limit: Int): [DashboardFollowUp!]!`
  - CRM reminders and followup dates.

## React Rendering Logic

The page at `dashboard/page.tsx` utilizes `useAuthStore` to extract `user.role` and selects the
layout rendering route:

```typescript
const role = user?.role || 'DOCTOR';
```

Based on the active role, the code renders `renderKPIs()` and `renderWidgets()`.

## CSS Layout Rules

- Layout consists of a standard flex vertical alignment containing a dynamic KPI grid
  (`grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`) and a main dashboard widgets grid
  (`grid-template-columns: 1fr 1fr`).
- Widgets use absolute sizes and CSS variables (e.g. `var(--bg-primary)`) to match global theme
  styling.
