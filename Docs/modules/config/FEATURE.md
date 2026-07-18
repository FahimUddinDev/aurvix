# Config & Localization (System Configuration, Multi-Branch & Translation)

## Overview

The System Configuration and Localization module manages hospital settings, geographical branch
assets, department layouts, translation settings, and active runtime variables. It acts as the
backbone configuration layer for billing templates, prescription tokens, and patient numbers (UHID).

## User Stories

- **As a Super Admin**, I want to update hospital profile details (such as names, addresses,
  websites, and default timezone/currencies), so that all clinical reports and billing invoices are
  accurately branded.
- **As an Administrator**, I want to create and edit branches, so that patient queues, billing, and
  employees can be separated by clinics.
- **As an Administrator**, I want to create and configure departments (e.g. Cardiology, Radiology)
  with uppercase codes, so that doctors and staff can be organized into departments.
- **As an Administrator**, I want to edit system default settings (e.g. consultation fees,
  registration costs), so that billing rules are set.
- **As any user**, I want to switch my UI language between English and Bengali instantly, so that I
  can use the system in my preferred language.

## Features List

- Hospital Core Profile Configuration (Bilingual names/addresses).
- Multi-Branch Management (Separate geographical branch clinics, status switches).
- Department Management (Unique uppercase codes, names).
- Category-Scoped System Configuration Defaults (PATIENT, BILLING, PHARMACY, and general).
- Real-time Language Switcher (English / Bengali UI toggle) with persisted DB locale tracking.

## Workflows

### Language Switch Flow

1. User clicks the "Language Toggle" (EN / বাংলা) in the TopBar.
2. Next.js router replaces the URL locale segment (e.g., `/en/settings` &rarr; `/bn/settings`).
3. If user is logged in, client calls the `updateUserLocale` Mutation to save their preference.
4. Next-intl instantly switches language translations.

## Business Rules

- Department codes must be uppercase alphanumeric (e.g., `EMER`, `OPD`).
- Phone numbers must be in BD standard formatting: `+880XXXXXXXXXX`.
- System default values must be parsed according to their defined database datatypes (e.g. checking
  number formatting before saving numbers).

## Related Modules

- **Billing**: Reads billing config variables (consultation fees, VAT percent).
- **EMR / Patient**: Prefix strings for UHIDs are retrieved from the Hospital Core Profile.

## SRS Mapping

- **FR-SYS.1**: Core Hospital profiles configuration.
- **FR-SYS.2**: Multi-branch support.
- **FR-SYS.3**: Dynamic department structures.
- **FR-LOC.1**: Dual-language translation support (EN/BN).
