---
name: security-review
description:
  Run the NFR-SEC checklist (auth, RBAC, encryption, audit logging, injection) against a module or
  diff
triggers:
  - /security-review
requires_approval: false
---

# Workflow: Security Review

## Objective

Check a module or pending diff against Aurevix's NFR-SEC requirements before it's considered done —
not a general-purpose pentest, a scoped checklist pass.

## Checklist

1. **Auth/RBAC** — every resolver method has an explicit `@Roles()` / `AuthGuard` — no endpoint left
   implicitly public. Field/record-level access (e.g. NID visibility, "doctor sees only their
   patients") enforced where applicable.
2. **Validation** — every mutation input passes through a Zod schema via `ZodValidationPipe`; no raw
   `any`/unchecked input reaches Prisma.
3. **Injection** — confirm all DB access goes through Prisma's parameterized queries; flag any raw
   SQL (`$queryRawUnsafe`) for manual review.
4. **Encryption at rest** — NID, diagnosis, and other NFR-SEC.4 fields use `pgcrypto` or
   application-level encryption, not plaintext columns.
5. **Audit logging** — mutations that create/update/delete sensitive records pass through
   `AuditInterceptor`; sensitive _reads_ (patient EMR, billing, NID) are logged too, per NFR-SEC.5.
6. **Secrets/logging** — no password, token, NID, or full diagnosis text appears in logs. Check
   `LoggingInterceptor` sanitization covers new fields.
7. **Rate limiting / lockout** — anything auth-adjacent (login, password reset, MFA) is covered by
   `ThrottlerGuard` and the account-lockout policy.
8. **Session handling** — no long-lived tokens issued outside the documented 15min access / 7-day
   refresh pattern.

## Output

For each item: Pass / Fail / N/A with the specific file:line, and a concrete fix for anything that
fails. Don't just say "looks fine" — cite what you checked.
