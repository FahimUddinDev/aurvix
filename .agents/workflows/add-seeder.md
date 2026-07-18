---
name: add-seeder
description:
  Add a new idempotent seeder file in the correct execution order with realistic Bangladeshi demo
  data
triggers:
  - /add-seeder
requires_approval: false
---

# Workflow: Add Seeder

## Objective

Add a seeder that is safe to re-run, deterministic, and slots into the existing numbered execution
order in `apps/api/src/database/prisma/seed/`.

## Steps

1. Read `seed/index.ts` to find the current numbered sequence and where the new seeder's
   dependencies (FKs) sit in that order.
2. Create `NN-<entity>.seed.ts` using `upsert` (never blind `create`) keyed on a natural unique
   field so re-running the seed command doesn't duplicate rows.
3. Use realistic Bangladeshi demo data per the `bd-localization` skill: `+880` phone format, BD
   names, BDT pricing, valid-looking-but-fake NIDs.
4. Use relative dates (`today ± N days`) for anything time-sensitive (appointments, attendance,
   expiry) so the demo stays fresh on every run.
5. Register the seeder in `seed/index.ts` in the correct order.
6. Confirm the module's demo login accounts (if relevant) still work after the change — don't
   silently alter existing seeded credentials.
7. Report the record count added and confirm the seeder is idempotent (show what happens on a second
   run).
