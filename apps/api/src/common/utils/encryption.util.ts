import { createHash, randomBytes } from 'crypto';
import * as argon2 from 'argon2';

/**
 * Hashes a password using Argon2id (NFR-SEC.3)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * SHA-256 hash for audit chain integrity
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Anonymization hash for GDPR/PII erasure engine
 * Overwrites PII fields with a deterministic-looking but unrecoverable hash
 */
export function anonymizeField(value: string, salt: string): string {
  return `anon_${createHash('sha256').update(`${value}:${salt}`).digest('hex').slice(0, 16)}`;
}
