// Aurevix HMS — Shared TypeScript Types
// Used by both apps/api and apps/web for shared data shapes

export interface JwtPayload {
  sub: string;
  email: string;
  hospitalId: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type Locale = 'en' | 'bn';

export type BDPhone = `+880${string}`;

export type Currency = 'BDT';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface BilingualString {
  en: string;
  bn?: string;
}

// ── Enums shared between FE and BE ─────────────────────────────────────────

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POS = 'A_POS',
  A_NEG = 'A_NEG',
  B_POS = 'B_POS',
  B_NEG = 'B_NEG',
  AB_POS = 'AB_POS',
  AB_NEG = 'AB_NEG',
  O_POS = 'O_POS',
  O_NEG = 'O_NEG',
}

export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  UNDER_CLEANING = 'UNDER_CLEANING',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  SSLCOMMERZ = 'SSLCOMMERZ',
  BKASH = 'BKASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum BillStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// ── Module roles for RBAC ───────────────────────────────────────────────────

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  PHARMACIST = 'PHARMACIST',
  RECEPTIONIST = 'RECEPTIONIST',
  ACCOUNTANT = 'ACCOUNTANT',
  HR_MANAGER = 'HR_MANAGER',
  RADIOLOGIST = 'RADIOLOGIST',
}

// ── Event contracts (for cross-module EventEmitter2 events) ─────────────────

export interface AppointmentCompletedEvent {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  visitId?: string;
}

export interface LabResultCriticalEvent {
  resultId: string;
  orderId: string;
  patientId: string;
  hospitalId: string;
  testName: string;
  value: string;
  flag: 'CRITICAL_HIGH' | 'CRITICAL_LOW';
}

export interface PaymentCompletedEvent {
  paymentId: string;
  billId: string;
  patientId: string;
  hospitalId: string;
  amount: number;
  method: PaymentMethod;
}

export interface AdmissionCreatedEvent {
  admissionId: string;
  patientId: string;
  bedId: string;
  hospitalId: string;
}

export interface DischargeCompletedEvent {
  admissionId: string;
  patientId: string;
  hospitalId: string;
  bedId: string;
}
