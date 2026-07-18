---
name: shared-zod-validator
description:
  Use when adding or changing form/input validation for Aurevix HMS. Trigger on "add a form",
  "validate this input", "zod schema".
---

# Skill: Shared Zod Validator Pattern

## When to use

Any new mutation input or form field needs a schema in `packages/validators/src/<domain>.schema.ts`
— this is the single source of truth consumed by both frontend (React Hook Form) and backend
(`ZodValidationPipe`).

## Pattern

```typescript
// packages/validators/src/<domain>.schema.ts
import { z } from 'zod';

export const create<Entity>Schema = z.object({
  // BD phone: always +880 followed by 10 digits
  phone: z.string().regex(/^\+880\d{10}$/, 'Invalid BD phone number'),

  // NID: 10-17 digits depending on old/new format
  nid: z.string().regex(/^\d{10,17}$/, 'Invalid NID').optional(),

  // money fields: non-negative, 2 decimal max, no currency symbol in the value
  amount: z.number().nonnegative().multipleOf(0.01),

  // bilingual label fields
  name: z.object({ en: z.string().min(1), bn: z.string().min(1) }),
});

export type Create<Entity>Input = z.infer<typeof create<Entity>Schema>;
```

## Rules

1. One schema file per domain, named after the module (`patient.schema.ts`, `billing.schema.ts`),
   not per-form.
2. Export both the schema and the inferred TS type from the same file.
3. Reuse primitives — don't redefine the BD phone regex or NID regex in more than one file; put
   shared primitives in `packages/validators/src/common.ts` and import them.
4. `createXSchema` and `updateXSchema` are usually `createXSchema.partial()` plus an `id` field —
   don't hand-duplicate the field list.
5. Never put business logic (DB lookups, uniqueness checks) inside a Zod schema — those belong in
   the service layer as an async check.
6. Any schema touching money, prescriptions, or patient identity fields should be reviewed against
   the `security-review` workflow before merge.

## Frontend usage

```tsx
const form = useForm<CreateXInput>({
  resolver: zodResolver(createXSchema),
  defaultValues: {/* sensible BD defaults, e.g. phone: '+880' */},
});
```

## Backend usage

```typescript
@UsePipes(new ZodValidationPipe(createXSchema))
async createX(@Args('input') input: CreateXInput) { ... }
```
