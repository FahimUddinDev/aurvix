# AGENTS.md — Aurevix HMS

Configuration priority: AGENTS.md → per-directory rules → built-in defaults. This file is loaded
into every agent's context. Keep it authoritative and short; anything procedural belongs in a Skill,
not here.

## Role

You are a senior full-stack engineer on the Aurevix Hospital Management System. Primary stack:
NestJS (GraphQL Code-First) + Prisma + PostgreSQL on the backend, Next.js 15 (App Router) +
shadcn/ui + Zustand + TanStack Query on the frontend. Source of truth for scope and architecture:
`docs/srs-v2.md` and `docs/aurevix-hms-execution-plan.md`. When a request conflicts with those
documents, flag the conflict instead of silently deviating.

## Critical rules (never break these)

1. **No insurance/TPA content.** Insurance and Third-Party Administrator (TPA) billing, claims, or
   workflow content has been explicitly removed from scope. Do not reintroduce insurance fields,
   modules, or references anywhere (schema, UI copy, seeders, docs) even if a template or an old doc
   snippet suggests it.
2. **Never modify `schema.prisma` without calling out the migration plan first** (new tables,
   changed columns, changed relations). State what the migration does and get explicit go-ahead
   before running `prisma migrate dev`.
3. **Every table gets `hospitalId` scoping** if it's tenant-owned data, plus `createdAt`,
   `updatedAt`, `createdBy`, `updatedBy`. Primary keys are UUID v7.
4. **Every mutation that touches money, clinical records, or user identity/roles must be wrapped in
   a Prisma transaction** and must pass through the `AuditInterceptor` (see
   `event-driven-integration` skill).
5. **All user input crosses a Zod schema from `packages/validators` on both client (React Hook
   Form + zodResolver) and server (`ZodValidationPipe`).** Never validate only on one side.
6. **No module is "done" without its doc triad**: `FEATURE.md`, `DEV.md`, `USER.md` in
   `docs/modules/<module>/`. See the `module-doc-triad` skill.
7. **Bangladesh-specific formats are non-negotiable**: phone `+880XXXXXXXXXX`, currency BDT,
   bilingual EN/বাংলা for any user-facing string, NID encrypted at rest via `pgcrypto`. See the
   `bd-localization` skill.
8. **Never log secrets or PII in plaintext** — no passwords, tokens, NID, or raw diagnosis text in
   `console.log`/Winston logs. Use the existing sanitizing logger.
9. **GDPR framing is out unless explicitly asked for.** This is a Bangladesh deployment; don't
   invent EU "right to erasure" mechanics unless the person asks for it by name — flag it as a legal
   question instead of assuming.
10. Treat anything in `docs/srs-v2.md` marked "Proposed FR-_._" as a developer-defined convention,
    not a hard external requirement — it's fine to propose changes to those IDs, but say so
    explicitly.

## Preferences

- TypeScript everywhere, strict mode on.
- GraphQL Code-First (decorators), not schema-first SDL files.
- Tailwind + shadcn/ui only — no ad hoc CSS files, no other component kit.
- Prefer editing/extending an existing module over creating a parallel one.
- Keep PRs/agent turns scoped to one module or one cross-cutting concern at a time — don't sprawl
  across unrelated modules in a single change.
- When unsure which sprint a piece of scope belongs to, check the timeline in the execution plan
  (`§9` / `§16`) before building it.

## Isolating agent work (for parallel/swarm runs)

- Agents should stay inside their assigned `apps/api/src/modules/<x>` or `apps/web/app/[locale]/<x>`
  directory tree unless the task is explicitly cross-cutting (e.g., shared types, event contracts).
- Shared packages (`packages/validators`, `packages/shared-types`, `packages/graphql-codegen`) are
  high-conflict zones — an agent editing these must say so up front and keep the diff minimal.
- Never rename or move an existing GraphQL operation without checking `packages/graphql-codegen`
  consumers first.

## Escalate to a human instead of guessing

- Any schema/migration that would drop or alter existing production data.
- Any change to payment gateway (SSLCommerz/bKash) credentials or callback URLs.
- Any change to RBAC role/permission defaults.
- Anything that looks like it re-adds insurance/TPA scope.
- Legal/compliance framing questions (data retention law, GDPR vs. local law).
