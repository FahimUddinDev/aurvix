import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a UUID v4.
 * Note: Prisma schema uses gen_random_uuid() (PostgreSQL) for DB-side generation.
 * Use this only when you need the ID application-side before insert.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generates a sequential UHID for a patient.
 * Format: {prefix}-{branchCode}-{paddedNumber}
 * Example: AV-DHK-000001
 */
export function generateUHID(prefix: string, branchCode: string, seq: number): string {
  const padded = String(seq).padStart(6, '0');
  return `${prefix}-${branchCode}-${padded}`;
}

/**
 * Generates a queue token label.
 * Example: T-001
 */
export function generateTokenLabel(seq: number): string {
  return `T-${String(seq).padStart(3, '0')}`;
}

/**
 * Generates a bill number.
 * Format: INV-{YYYY}{MM}{DD}-{seq}
 */
export function generateBillNo(seq: number): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `INV-${date}-${String(seq).padStart(4, '0')}`;
}

/**
 * Generates a purchase order number.
 */
export function generatePONumber(seq: number): string {
  const d = new Date();
  return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
}
