---
name: event-driven-integration
description:
  Use when a module needs to trigger behavior in another module (e.g. consultation complete ->
  billing, lab result ready -> notification). Trigger on "cross-module", "trigger billing", "notify
  on", "event emitter".
---

# Skill: Event-Driven Integration Pattern

## When to use

Whenever module A needs something to happen in module B as a side effect, instead of module A
directly importing and calling module B's service.

## Why

Keeps modules as bounded contexts (per the plan's "Modular Monolith" architecture principle) so they
stay extractable into microservices later, and keeps `AuditInterceptor` / notification hooks
consistent across all triggers.

## Pattern

```typescript
// Emitting side (e.g. visit.service.ts)
import { EventEmitter2 } from '@nestjs/event-emitter';

async completeConsultation(visitId: string) {
  // ...persist changes in a transaction...
  this.eventEmitter.emit('consultation.completed', {
    visitId,
    patientId,
    hospitalId,
    timestamp: new Date(),
  });
}
```

```typescript
// Listening side (e.g. billing.listener.ts)
import { OnEvent } from '@nestjs/event-emitter';

@OnEvent('consultation.completed')
async handleConsultationCompleted(payload: ConsultationCompletedEvent) {
  await this.billingService.createBillFromVisit(payload.visitId);
}
```

## Established event names (extend, don't rename)

- `consultation.completed` → billing creates line items
- `lab.ordered` → lab module worklist entry
- `lab.result.critical` → notification module: immediate SMS + in-app alert
- `prescription.created` → pharmacy queue entry
- `admission.discharged` → bed release + billing finalize
- `notification.send` → notification module dispatch (SMS/email)

## Rules

1. Define the event payload type in `packages/shared-types` so both emitter and listener are
   type-checked against the same contract.
2. Event names are `<domain>.<past-tense-verb>` — keep this consistent so `/sprint-check` and docs
   generation can grep for them reliably.
3. Listeners must be idempotent — an event may be re-delivered (e.g. after a BullMQ retry); guard
   against double-billing / double-notification.
4. Anything user-visible that results from an event (a bill appearing, a bed becoming available)
   must also be reflected via the relevant WebSocket subscription, not just written to the DB
   silently.
5. Document new events in the emitting module's `DEV.md` under "Event Emitters" and the listening
   module's `DEV.md` under whichever section covers inbound triggers.
