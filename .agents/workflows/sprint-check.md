---
name: sprint-check
description:
  Verify a given sprint's deliverable checklist from the execution plan against what actually exists
  in the repo
triggers:
  - /sprint-check
requires_approval: false
---

# Workflow: Sprint Check

## Objective

Give an honest, evidence-based status of a sprint (S0–S19) — not a guess from memory of the plan.

## Steps

1. Ask which sprint number (or infer from current branch/recent commits).
2. Pull that sprint's checklist items from `docs/aurevix-hms-execution-plan.md`.
3. For each item, check the repo for concrete evidence: does the GraphQL operation exist in the
   resolver? Does the frontend page/route exist? Does the seeder exist and run? Does the doc triad
   exist?
4. Report a per-item ✅ / ⚠️ (partial) / ❌ status with the file path that proves it, not just a
   claim.
5. Call out anything found in the repo that's in-scope for a _later_ sprint — this is a signal of
   scope drift, worth flagging even if it "looks done."
6. Summarize with a percentage-complete and the top 3 blockers to closing the sprint.
