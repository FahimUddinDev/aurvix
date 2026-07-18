import { z } from 'zod';

export const labResultSchema = z.object({
  orderId: z.string().uuid(),
  testId: z.string().uuid(),
  value: z.string().min(1),
  unit: z.string().optional(),
  flag: z.enum(['NORMAL', 'ABNORMAL', 'CRITICAL_HIGH', 'CRITICAL_LOW']).default('NORMAL'),
  normalRange: z.string().optional(),
  remarks: z.string().optional(),
});

export const sampleCollectionSchema = z.object({
  orderId: z.string().uuid(),
  sampleType: z.string().min(1),
  barcode: z.string().min(1),
});

export type LabResultInput = z.infer<typeof labResultSchema>;
export type SampleCollectionInput = z.infer<typeof sampleCollectionSchema>;
