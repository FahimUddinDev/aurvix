import { z } from 'zod';

export const admissionSchema = z.object({
  patientId: z.string().uuid(),
  bedId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  admissionNotes: z.string().optional(),
});

export const nursingNoteSchema = z.object({
  admissionId: z.string().uuid(),
  noteType: z.enum(['PROGRESS', 'HANDOFF', 'INCIDENT', 'ASSESSMENT']).default('PROGRESS'),
  content: z.string().min(1).max(5000),
});

export const dischargeSchema = z.object({
  admissionId: z.string().uuid(),
  finalDiagnosis: z.string().min(1),
  treatmentSummary: z.string().optional(),
  dischargeCondition: z.enum(['STABLE', 'CRITICAL', 'AGAINST_ADVICE', 'EXPIRED']).default('STABLE'),
  followUpInstructions: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
  medications: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;
export type NursingNoteInput = z.infer<typeof nursingNoteSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;
