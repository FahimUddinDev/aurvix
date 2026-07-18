---
name: generate-module-docs
description:
  Generate or refresh the FEATURE.md / DEV.md / USER.md triad for an existing module by reading its
  actual code
triggers:
  - /generate-module-docs
requires_approval: false
---

# Workflow: Generate Module Docs

## Objective

Produce accurate documentation for a module by reading the real code, not by guessing from the
module name.

## Steps

1. Ask which module (or infer from current open files / recent diff).
2. Read the module's resolver, service, DTOs, Prisma models, and any frontend pages under
   `apps/web/app/[locale]/<module>/`.
3. Apply the `module-doc-triad` skill's templates exactly — do not invent new section headers.
4. In `DEV.md`, list every GraphQL operation with its actual signature pulled from the resolver, not
   a paraphrase.
5. In `FEATURE.md`, map each feature back to its FR-ID / NFR-ID / SRS section using the prefix table
   in the execution plan §5.2. If no mapping exists, write "Proposed FR-<PREFIX>.*" and flag it for
   confirmation rather than inventing an ID.
6. In `USER.md`, only describe UI flows that actually exist in the frontend code — do not describe
   planned-but-unbuilt screens.
7. Diff against any existing doc triad for the module and call out what changed since the last
   version.
