import { z } from 'zod';

export const vitalsSchema = z.object({
  visitId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  systolicBp: z.number().int().min(0).max(300).optional(),
  diastolicBp: z.number().int().min(0).max(200).optional(),
  heartRate: z.number().int().min(0).max(300).optional(),
  temperature: z.number().min(30).max(45).optional(),
  spo2: z.number().int().min(0).max(100).optional(),
  respiratoryRate: z.number().int().min(0).max(100).optional(),
  weightKg: z.number().min(0).max(500).optional(),
  heightCm: z.number().min(0).max(300).optional(),
});

export const diagnosisSchema = z.object({
  visitId: z.string().uuid(),
  icd10Code: z.string().max(10).optional(),
  icd10Desc: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  isPrimary: z.boolean().default(false),
});

export const clinicalNoteSchema = z.object({
  visitId: z.string().uuid(),
  noteType: z.enum(['SOAP', 'PROGRESS', 'FREE_TEXT']).default('SOAP'),
  content: z.string().min(1).max(5000),
});

export type VitalsInput = z.infer<typeof vitalsSchema>;
export type DiagnosisInput = z.infer<typeof diagnosisSchema>;
export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;
