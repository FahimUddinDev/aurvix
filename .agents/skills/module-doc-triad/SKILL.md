---
name: module-doc-triad
description:
  Use when a module needs its FEATURE.md / DEV.md / USER.md documentation written or updated.
  Trigger on "document this module", "write docs", "module is done".
---

# Skill: Module Doc Triad

## When to use

Before a module can be considered complete (per AGENTS.md rule 6), or when asked to write/refresh
docs for one.

## Location

`docs/modules/<module>/FEATURE.md`, `DEV.md`, `USER.md`

## FEATURE.md template

```markdown
# [Module Name]

## Overview

## User Stories

## Features List

## Workflows

## Business Rules

## Screenshots / Wireframes

## Related Modules

## SRS Mapping <!-- FR-IDs / NFR-IDs — mark unmapped items "Proposed FR-<PREFIX>.*" -->
```

## DEV.md template

```markdown
# [Module Name] — Developer Guide

## Architecture

## Database Schema

## GraphQL API Reference <!-- pull real signatures from the resolver -->

## Zod Schemas

## Guards & Decorators

## Event Emitters

## Background Jobs

## Testing

## Environment Variables

## Known Limitations / Future Work
```

## USER.md template

```markdown
# [Module Name] — User Guide

## Getting Started

## Step-by-Step Instructions

## Keyboard Shortcuts

## Print Guides

## Troubleshooting / FAQ

## Bengali Translation Notes (if applicable)
```

## Rules

1. Write from the actual code, not from the execution-plan description of what the module _should_
   do — if reality has diverged from the plan, note it under "Known Limitations."
2. GraphQL API Reference entries must match the resolver's actual argument types and return types
   exactly.
3. Don't skip a section — write "N/A" with one line of why, rather than omitting it, so the triad
   stays diffable across modules.
4. SRS Mapping section is where scope/traceability gaps get caught — if a feature exists with no ID,
   that's worth surfacing, not hiding.
