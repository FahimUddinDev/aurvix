import { z } from 'zod';

export const updateHospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  nameBn: z.string().optional(),
  address: z.string().optional(),
  addressBn: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+880\d{10}$/, 'Phone must be in format +880XXXXXXXXXX')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logoUrl: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
  uhidPrefix: z.string().min(1, 'UHID Prefix is required'),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  nameBn: z.string().optional(),
  address: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+880\d{10}$/, 'Phone must be in format +880XXXXXXXXXX')
    .optional()
    .or(z.literal('')),
});

export const updateBranchSchema = createBranchSchema.extend({
  isActive: z.boolean().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  nameBn: z.string().optional(),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters')
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric'),
  description: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.extend({
  isActive: z.boolean().optional(),
});

export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
