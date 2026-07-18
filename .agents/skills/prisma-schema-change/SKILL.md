---
name: prisma-schema-change
description:
  Use whenever a task requires adding or modifying models in schema.prisma. Trigger on "add a
  table", "new model", "add a field", "migration".
---

# Skill: Prisma Schema Change

## When to use

Any change to `apps/api/prisma/schema.prisma` or `apps/api/src/database/prisma/schema.prisma`.

## Required shape for every new tenant-owned model

```prisma
model Example {
  id         String   @id @default(uuid(7))
  hospitalId String
  hospital   Hospital @relation(fields: [hospitalId], references: [id])

  // ...domain fields...

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  createdBy  String?
  updatedBy  String?
  deletedAt  DateTime?   // only for clinical/audit-retained entities — see below

  @@index([hospitalId])
}
```

## Rules

1. **UUID v7 primary keys** everywhere — time-sortable, not random UUID v4.
2. **`hospitalId` + relation + index** on every model scoped to a hospital branch. Global/reference
   data (e.g. `IcdCode`, `NotificationTemplate` defaults) is the exception — say explicitly why a
   model is exempt.
3. **Soft delete (`deletedAt`) only on clinical/audit-retained entities** (Visit, Prescription,
   LabResult, Bill, AuditLog, etc.) per the plan's retention policy. Non-clinical operational data
   can hard-delete unless told otherwise.
4. **Sensitive fields** (NID, diagnosis, free-text clinical notes) get a comment flagging them for
   `pgcrypto` / application-level encryption — don't leave them as plain `String` without calling it
   out.
5. **Never rename or drop a column that has data in a running environment** without proposing an
   expand-contract migration (add new column → backfill → switch reads → drop old column in a later
   step). One-shot destructive renames are not allowed without explicit human approval.
6. **JSONB for i18n-able labels** (department names, template text) — `Json` type keyed by locale,
   matching the pattern already used for `Localization`.

## Process

1. Write the schema diff and show it before running any migrate command.
2. State which existing seeders/resolvers will need updating because of the change.
3. Run `prisma migrate dev --name <descriptive_name>` only after explicit go-ahead — never
   `prisma migrate reset` in an environment that isn't explicitly confirmed to be disposable.
4. Update `packages/shared-types` if the shape is consumed by the frontend.
