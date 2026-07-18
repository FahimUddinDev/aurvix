---
name: bd-localization
description:
  Use for anything involving phone numbers, NID, currency, dates, or bilingual (English/Bengali)
  text in Aurevix HMS. Trigger on "phone field", "NID", "currency", "translate", "bilingual", "demo
  data".
---

# Skill: Bangladesh Localization Conventions

## When to use

Any form field, seeder data, or UI string touching BD-specific formats.

## Phone numbers

- Always `+880` followed by 10 digits: `/^\+880\d{10}$/`.
- Default form value: `+880` (user fills in the rest).
- Never accept a bare 11-digit local format (`01XXXXXXXXX`) without normalizing it to `+880` before
  it hits the schema.

## NID (National ID)

- 10–17 digits depending on old vs. smart NID format: `/^\d{10,17}$/`.
- Always encrypted at rest via `pgcrypto` — never stored or logged in plaintext. Never put a
  real-looking NID in a seeder; use an obviously-fake-but-format-valid number.

## Currency

- BDT only for MVP. Format as `৳X,XXX` or `BDT X,XXX` depending on where the rest of the UI already
  formats currency — check `PriceInput` component before introducing a second format.
- Store amounts as integers in the smallest unit or as `Decimal` — never `Float` — to avoid rounding
  errors in billing.

## Bilingual (EN / বাংলা) content

- Every user-facing label needs an entry in both `lib/i18n/en.json` and `lib/i18n/bn.json` with
  matching keys — never a hardcoded English string in a component.
- DB-stored labels (department names, templates) use JSONB: `{ "en": "...", "bn": "..." }`.
- Bengali translation must preserve the JSON key structure exactly — only translate values, never
  keys.
- Use Noto Sans Bengali for Bengali text per the brand typography spec; don't let Bengali text fall
  back to a Latin-only font stack.

## Demo/seed data

- Use realistic Bangladeshi names, addresses, and phone numbers, but never reuse a real hospital's
  actual patient/staff data — seeders are synthetic.
- Dates for time-sensitive seed data (appointments, attendance, expiry) are relative to "today" so
  demos stay fresh — never hardcode a past year.

## Common mistake to flag

- GDPR-style "right to erasure" language creeping into BD-context docs or code comments — flag it
  rather than assuming GDPR governs this deployment (see AGENTS.md rule 9).
