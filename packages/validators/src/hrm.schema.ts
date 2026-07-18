import { z } from 'zod';

const bdPhone = z.string().regex(/^\+880\d{10}$/, 'Phone must be in format +880XXXXXXXXXX');

export const employeeSchema = z.object({
  hospitalId: z.string().uuid(),
  departmentId: z.string().uuid(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  firstNameBn: z.string().optional(),
  lastNameBn: z.string().optional(),
  designation: z.string().min(1),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'])
    .default('FULL_TIME'),
  joiningDate: z.coerce.date(),
  phone: bdPhone.optional(),
  email: z.string().email().optional(),
  basicSalary: z.number().min(0),
});

export const leaveRequestSchema = z
  .object({
    leaveTypeId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().max(500).optional(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export const salaryStructureSchema = z.object({
  name: z.string().min(1),
  basic: z.number().min(0),
  houseRent: z.number().min(0).default(0),
  medical: z.number().min(0).default(0),
  transport: z.number().min(0).default(0),
  providentFund: z.number().min(0).default(0),
  incomeTaxRate: z.number().min(0).max(100).default(0),
});

export const grievanceSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>;
export type GrievanceInput = z.infer<typeof grievanceSchema>;
