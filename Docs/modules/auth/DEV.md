# Auth & RBAC — Developer Guide

## Architecture

The Auth & RBAC module utilizes a NestJS backend paired with a Next.js App Router frontend.
Communication is conducted via a GraphQL API.

### Authentication Flow

```
[Next.js Client] -> (login mutation) -> [NestJS API] -> validates password (Argon2)
                                                |
                              (If MFA is active: returns mfaToken)
                                                |
                         (Else: returns JWT Access Token + Refresh Token)
```

## Database Schema

The auth system integrates with the following tables in `schema.prisma`:

- **User**: Stores email, passwordHash, status (`ACTIVE`, `INACTIVE`, `LOCKED`,
  `PENDING_VERIFICATION`), `mfaEnabled`, and foreign relations.
- **Role**: Stores role names (system keys) and display names.
- **Permission**: System permissions describing module boundaries.
- **RolePermission**: Maps permissions to custom and system roles.
- **MfaSecret**: Stores encrypted secret keys for TOTP tokens.

## GraphQL API Reference

### Mutations

- `login(input: LoginInput!): AuthPayload!`
  - Authenticates user. Returns access/refresh tokens or `mfaRequired` status.
- `verifyMfaLogin(mfaToken: String!, code: String!): AuthPayload!`
  - Verifies TOTP code during multi-factor authentication check.
- `refreshToken(token: String!): AuthPayload!`
  - Renews access token using a valid refresh token.
- `logout(refreshToken: String): Boolean!`
  - Invalidates user session tokens.
- `forgotPassword(email: String!): Boolean!`
  - Generates reset token and sends link to the user.
- `resetPassword(token: String!, password: String!): Boolean!`
  - Replaces password if the reset token is verified.
- `enableMfa(token: String!): Boolean!`
  - Verifies verification code and flags user profile as `mfaEnabled = true`.
- `disableMfa(token: String!): Boolean!`
  - Deactivates MFA configuration for the user.

### Queries

- `me: AuthUserPayload!`
  - Returns details of the logged-in user, including their role and `mfaEnabled` status.

## Zod Schemas

Located in `packages/validators/src/auth.schema.ts`:

- `loginSchema`: Validates login form fields.
- `createUserSchema`: Validates password rules, first/last names, and phone format
  (`+880XXXXXXXXXX`).
- `resetPasswordSchema`: Validates reset token and password confirmation matching.

## Guards & Decorators

- `@Public()`: Bypasses authentication guards.
- `@Roles(...roles: string[])`: resticts access to specified roles.
- `AuthGuard`: Resolves JWT from headers and checks validity.
- `RolesGuard`: Matches user's role against the endpoint's `@Roles` requirement.

## Environment Variables

Configured in root `.env` and `apps/api/.env`:

- `DATABASE_URL`: Connection string for PostgreSQL database.
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`: Asymmetric RS256 keys.
- `JWT_ACCESS_EXPIRY`: Lifespan of access token (e.g. `15m`).
- `JWT_REFRESH_EXPIRY`: Lifespan of refresh token (e.g. `7d`).

## Testing

- **Unit Tests**:
  - Run `pnpm --filter @aurevix/api test` to test password hashes, JWT validations, and RBAC guards.
- **E2E Tests**:
  - Run `pnpm --filter @aurevix/api test:e2e` for testing full integration endpoints.
