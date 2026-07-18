import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  departmentId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  type: z.enum(['SCHEDULED', 'WALK_IN', 'EMERGENCY', 'FOLLOW_UP']).default('SCHEDULED'),
  scheduledDate: z.coerce.date(),
  slotStartTime: z.string().optional(),
  slotEndTime: z.string().optional(),
  chiefComplaint: z.string().max(500).optional(),
});

export const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  scheduledDate: z.coerce.date(),
  slotStartTime: z.string().optional(),
});

export const cancelSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type RescheduleInput = z.infer<typeof rescheduleSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
