# Dashboard Module — User Guide

## Overview

The Dashboard is the home page of the Aurevix Hospital Management System. It provides a real-time
overview of the tasks, patients, and operational metrics relevant to your specific job role.

## Understanding Your Dashboard

### 1. Admin / Super Admin Views

- **Today's Revenue**: Daily total revenue collected across all departments (cash and digital
  payments).
- **Monthly Revenue**: Month-to-date cumulative collections.
- **Today's Appointments**: Total appointments booked for the day.
- **Ward Bed Occupancy**: Live gauge of ward occupancy. Each progress bar tracks active beds vs.
  total beds in specific wards.
- **Recent Activity Logs**: Real-time log of system modifications.

### 2. Doctor Views

- **Consultations**: Total appointments assigned to you today.
- **Pending Lab Results**: Patient diagnostic tests awaiting your review and validation.
- **Follow-Ups**: Upcoming routine followups and appointment schedules.

### 3. Pharmacist Views

- **Pending Prescriptions**: Prescriptions issued by doctors that require dispensing.
- **Low Drug Stock Warnings**: Automatically lists medicines that fall below their minimum safety
  threshold (reorder levels).

### 4. Nurse & Lab Tech Views

- **Ward Occupancy**: Details occupied and available bed resources.
- **Pending Diagnostic Lists**: Awaiting sample collections and test reports validation.

## Troubleshooting / FAQ

#### Why are my metrics not updating?

The dashboard uses active cache lifespans. Click another page in the sidebar and return to
**Dashboard** to trigger a manual refetch of the latest database statistics.

#### Why do I see a blank dashboard?

Your role may not be assigned to specific widgets. If you believe this is in error, contact your
hospital system administrator to review your RBAC permissions settings.
