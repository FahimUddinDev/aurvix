---
name: nestjs-graphql-module
description:
  Use when creating or extending a NestJS backend module for Aurevix HMS (resolver, service, DTOs,
  guards, pagination). Trigger on "new module", "add resolver/mutation/query", "backend for
  <feature>".
---

# Skill: NestJS GraphQL Module Pattern

## When to use

Any time you're adding backend surface area: a new module, a new query/mutation/subscription on an
existing module, or a new guard/decorator.

## Conventions

### File layout

```
modules/<name>/
  <name>.module.ts
  <name>.resolver.ts
  <name>.service.ts
  dto/
    create-<name>.input.ts
    update-<name>.input.ts
    <name>.filter.input.ts
  <name>.entity.ts        # GraphQL @ObjectType, mirrors Prisma model
```

### Resolver rules

- One resolver class per module; inject the service, never Prisma directly in the resolver.
- Every mutation/query has `@UseGuards(AuthGuard, RolesGuard)` and `@Roles(...)` unless explicitly
  `@Public()`.
- Use `@CurrentUser()` decorator to get the authenticated user — never trust a `userId` passed in
  the input for authorization decisions.
- List queries take a `filters` input + `pagination` input (`{ skip, take }` or cursor-based,
  matching whatever the rest of the codebase already uses — check an existing module like `patient`
  before choosing).
- Use DataLoader for any relation that would N+1 (e.g., resolving `doctor` off a list of
  `appointment`s).

### Service rules

- Service methods take already-validated (Zod) DTOs.
- Wrap multi-table writes in `this.prisma.$transaction(...)`.
- Emit domain events via `@nestjs/event-emitter` for anything another module needs to react to (see
  `event-driven-integration` skill) instead of directly importing the other module's service.

### Errors

- Throw NestJS GraphQL exceptions (`BadRequestException`, `ForbiddenException`, `NotFoundException`)
  — never return `null`/silent failure for an error condition the frontend needs to handle.

## Anti-patterns to avoid

- Resolver methods with business logic inline (belongs in the service).
- Fetching all records then filtering in JS instead of a Prisma `where`.
- Bypassing the shared Zod schema by hand-validating with `if` statements.
