import { z } from 'zod';

export const prescriptionItemSchema = z.object({
  medicineId: z.string().uuid(),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  duration: z.string().min(1).max(100),
  route: z.enum(['ORAL', 'IV', 'IM', 'SC', 'TOPICAL', 'INHALATION', 'SUBLINGUAL']).default('ORAL'),
  instructions: z.string().max(500).optional(),
  qty: z.number().int().min(1).max(9999),
});

export const prescriptionSchema = z.object({
  visitId: z.string().uuid(),
  items: z.array(prescriptionItemSchema).min(1),
  notes: z.string().max(1000).optional(),
  validUntil: z.coerce.date().optional(),
});

export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
