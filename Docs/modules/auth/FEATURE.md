# Auth & RBAC (Authentication & Role-Based Access Control)

## Overview

The Auth & RBAC module is the security core of the Aurevix Hospital Management System. It manages
user authentication, JSON Web Token (JWT) lifetimes, multi-factor authentication (MFA via TOTP), and
granular role-based access controls to secure clinical records, patient identity, and financial
transactions.

## User Stories

- **As a staff member (e.g., Doctor, Receptionist)**, I want to securely log in with my email and
  password, so that I can access my dashboard and features relevant to my role.
- **As an administrator**, I want to enforce Multi-Factor Authentication (MFA) for administrative
  and clinical accounts to prevent unauthorized access.
- **As a hospital employee**, I want to reset my password securely if I forget it, so that I can
  regain access to my account without human intervention.
- **As a Super Admin**, I want to configure roles and granular permission matrices, so that I can
  control access to features and patient records.

## Features List

- JWT-based Session Management (RS256 asymmetric keys).
- Multi-Factor Authentication (MFA) using Time-Based One-Time Passwords (TOTP).
- Granular Role-Based Access Control (RBAC) with hierarchical permissions.
- Real-time User Activity Locking (Lockout after 5 failed login attempts with a 15-minute cooldown).
- Security Audit log triggers for all sensitive mutations (auth, payments, clinical).
- Self-Service password recovery flow (forgot/reset password).

## Workflows

### User Login

1. User enters email and password.
2. If credentials match, system checks if MFA is enabled.
   - If MFA enabled: returns an `mfaToken` and prompts for verification code.
   - If MFA disabled: issues JWT access token + refresh token.
3. System establishes local session and redirects to Dashboard.

### MFA Activation

1. Authenticated user navigates to Security Settings.
2. Clicks "Enable MFA" to generate a TOTP secret and QR code.
3. User scans the QR code with their authenticator app.
4. User enters the 6-digit verification code to confirm and lock in MFA.

## Business Rules

- Passwords must contain a minimum of 8 characters including uppercase, lowercase, numbers, and
  special characters.
- Tokens have limited lifespans: Access Token expires in 15 minutes, Refresh Token expires in 7
  days.
- System roles (`SUPER_ADMIN`, `ADMIN`) are locked and cannot be deleted or modified.
- Bangladeshi localization requirements: phone numbers must adhere to the format `+880XXXXXXXXXX`.

## Screenshots / Wireframes

_N/A — Wireframes and UI designs are implemented in next-js components using responsive CSS and
design tokens._

## Related Modules

- **User Management**: Creating and deactivating employee/staff accounts.
- **Audit Module**: Logs every authentication attempt, role update, and login block.

## SRS Mapping

- **NFR-SEC.1**: Authentication validation.
- **NFR-SEC.2**: Granular role-based access control guards.
- **NFR-SEC.3**: Secure password hashing (Argon2id).
- **NFR-SEC.7**: Account lockout and cooldown enforcement.
