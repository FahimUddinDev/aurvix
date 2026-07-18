---
name: new-module
description:
  Scaffold a complete new Aurevix HMS module (backend + frontend + validation + seeder stub + doc
  triad)
triggers:
  - /new-module
requires_approval: true
---

# Workflow: New Module

## Objective

Scaffold a new feature module end-to-end, consistent with the patterns already established in the
codebase (see `nestjs-graphql-module`, `shared-zod-validator`, and `module-doc-triad` skills — load
all three before starting).

## Inputs to ask for if not given

- Module name (kebab-case, e.g. `blood-bank`)
- One-line purpose
- Which SRS section / FR-ID prefix it maps to
- Whether it needs a frontend route group or is backend-only

## Steps

1. **Confirm scope** — restate the module's purpose and its SRS/FR-ID mapping back to the user
   before writing any code. If it looks like it overlaps an existing module, say so and stop.
2. **Backend**: create `apps/api/src/modules/<module>/` with `<module>.module.ts`,
   `<module>.resolver.ts`, `<module>.service.ts`, a `dto/` folder, and register it in
   `app.module.ts`. Apply the `nestjs-graphql-module` skill for guard/DTO/pagination conventions.
3. **Validation**: add the Zod schema(s) to `packages/validators/src/<module>.schema.ts` per the
   `shared-zod-validator` skill. Export the inferred TS type.
4. **Database**: propose the `schema.prisma` additions (models, relations, `hospitalId`, audit
   fields, UUID v7 PK) as a diff and wait for approval before running a migration.
5. **Frontend** (if applicable): create `apps/web/app/[locale]/<module>/` pages, a form component
   under `components/forms/` using RHF + zodResolver, and a GraphQL query/mutation file under
   `lib/graphql/`.
6. **Seeder stub**: add `apps/api/src/database/prisma/seed/NN-<module>.seed.ts` following the
   idempotent upsert pattern used by existing seeders, and wire it into `seed/index.ts`. Leave
   realistic-but-clearly-fake Bangladeshi demo data (see `bd-localization` skill).
7. **Docs**: generate the doc triad (`FEATURE.md`, `DEV.md`, `USER.md`) under
   `docs/modules/<module>/` per the `module-doc-triad` skill. Do not mark the module complete
   without all three.
8. **Report**: list every file created/changed, the Prisma diff (if any) still pending approval, and
   which tests still need to be written.
