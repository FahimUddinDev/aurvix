import { z } from 'zod';
export const consentSchema = z.object({
  patientId: z.string().uuid(),
  templateId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  witnessName: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});
export type ConsentInput = z.infer<typeof consentSchema>;
