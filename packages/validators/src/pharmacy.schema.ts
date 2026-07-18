import { z } from 'zod';

const paymentMethod = z.enum(['CASH', 'SSLCOMMERZ', 'BKASH', 'BANK_TRANSFER']);

export const posSaleItemSchema = z.object({
  medicineId: z.string().uuid(),
  batchId: z.string().uuid(),
  qty: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
});

export const splitPaymentSchema = z.object({
  method: paymentMethod,
  amount: z.number().min(0.01),
  reference: z.string().optional(),
});

export const posSaleSchema = z.object({
  shiftId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  items: z.array(posSaleItemSchema).min(1),
  payments: z.array(splitPaymentSchema).min(1),
  discount: z.number().min(0).default(0),
});

export const shiftCloseSchema = z.object({
  shiftId: z.string().uuid(),
  actualCash: z.number().min(0),
  notes: z.string().optional(),
});

export const dispenseSchema = z.object({
  prescriptionId: z.string().uuid(),
  items: z
    .array(
      z.object({
        medicineId: z.string().uuid(),
        batchId: z.string().uuid(),
        qty: z.number().int().min(1),
      }),
    )
    .min(1),
  isPartial: z.boolean().default(false),
});

export const posReturnSchema = z.object({
  saleId: z.string().uuid(),
  items: z
    .array(
      z.object({
        medicineId: z.string().uuid(),
        batchId: z.string().uuid(),
        qty: z.number().int().min(1),
      }),
    )
    .min(1),
  isWasted: z.boolean().default(false),
  reason: z.string().optional(),
});

export type PosSaleInput = z.infer<typeof posSaleSchema>;
export type ShiftCloseInput = z.infer<typeof shiftCloseSchema>;
export type DispenseInput = z.infer<typeof dispenseSchema>;
export type PosReturnInput = z.infer<typeof posReturnSchema>;
