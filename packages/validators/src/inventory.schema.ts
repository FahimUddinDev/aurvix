import { z } from 'zod';
export const inventoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  reorderLevel: z.number().int().min(0).default(0),
  hospitalId: z.string().uuid(),
});
export const stockAdjustmentSchema = z.object({
  itemId: z.string().uuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'RETURN']),
  qty: z.number().int().min(1),
  notes: z.string().optional(),
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
