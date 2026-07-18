import { z } from 'zod';

const bdPhone = z.string().regex(/^\+880\d{10}$/, 'Phone must be in format +880XXXXXXXXXX');

const nid = z
  .string()
  .regex(/^\d{10,17}$/, 'NID must be 10 or 17 digits')
  .optional();

export const createPatientSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  firstNameBn: z.string().max(100).optional(),
  lastNameBn: z.string().max(100).optional(),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z
    .enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'])
    .optional(),
  phone: bdPhone,
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  addressBn: z.string().max(500).optional(),
  nid,
  hospitalId: z.string().uuid(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(2),
        relationship: z.string().min(2),
        phone: bdPhone,
      }),
    )
    .optional(),
  allergies: z
    .array(
      z.object({
        allergen: z.string().min(1),
        reaction: z.string().optional(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).default('MODERATE'),
      }),
    )
    .optional(),
});

export const updatePatientSchema = createPatientSchema.partial().omit({ hospitalId: true });

export const patientSearchSchema = z.object({
  query: z.string().min(1).max(200),
  hospitalId: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientSearchInput = z.infer<typeof patientSearchSchema>;
