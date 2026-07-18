import { z } from 'zod';
export const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  slotDurationMin: z.number().int().min(5).max(120).default(15),
  maxPatients: z.number().int().min(1).default(20),
});
export const createDoctorSchema = z.object({
  userId: z.string().uuid(),
  departmentId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  bmdcNumber: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  consultationFee: z.number().min(0).default(0),
  schedules: z.array(scheduleSlotSchema).optional(),
});
export type ScheduleSlotInput = z.infer<typeof scheduleSlotSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
