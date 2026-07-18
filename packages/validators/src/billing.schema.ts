import { z } from 'zod';

export const createBillSchema = z.object({
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  admissionId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const lineItemSchema = z.object({
  billId: z.string().uuid(),
  servicePriceId: z.string().uuid().optional(),
  description: z.string().min(1),
  qty: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  taxPercent: z.number().min(0).max(100).default(0),
});

export const cashPaymentSchema = z.object({
  billId: z.string().uuid(),
  amount: z.number().min(0.01),
  notes: z.string().optional(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().min(0.01),
  reason: z.string().min(1),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
