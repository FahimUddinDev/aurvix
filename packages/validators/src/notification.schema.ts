import { z } from 'zod';
export const notificationTemplateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']),
  trigger: z.string().min(1),
  bodyEn: z.string().min(1),
  bodyBn: z.string().optional(),
  subjectEn: z.string().optional(),
});
export const doctorSchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  bmdcNumber: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  consultationFee: z.number().min(0).default(0),
});
export type NotificationTemplateInput = z.infer<typeof notificationTemplateSchema>;
export type DoctorInput = z.infer<typeof doctorSchema>;
