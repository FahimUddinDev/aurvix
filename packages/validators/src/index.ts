// ============================================================================
// packages/validators — Aurevix HMS Shared Zod Schemas
// Consumed by: apps/web (RHF + zodResolver) + apps/api (ZodValidationPipe)
// Rules: BD phone +880XXXXXXXXXX, NID 10-17 digits, BDT currency
// ============================================================================

export * from './auth.schema';
export * from './patient.schema';
export * from './doctor.schema';
export * from './appointment.schema';
export * from './visit.schema';
export * from './prescription.schema';
export * from './lab.schema';
export * from './pharmacy.schema';
export * from './billing.schema';
export * from './admission.schema';
export * from './hrm.schema';
export * from './inventory.schema';
export * from './consent.schema';
export * from './notification.schema';
export * from './config.schema';
