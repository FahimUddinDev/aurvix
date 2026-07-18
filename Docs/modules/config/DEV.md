# Config & Localization — Developer Guide

## Architecture

This module utilizes a NextJS frontend powered by React Hook Form, Zod validators, and
Apollo-GraphQL client connections linked to a NestJS backend.

## Database Schema

The following Prisma models in `schema.prisma` are used:

- **Hospital**: Core table storing name, nameBn, address, addressBn, phone, timezone, currency, and
  uhidPrefix.
- **Branch**: Maps geographical branches. Contains a relation to `Hospital` (`hospitalId`).
- **Department**: Clinic departments mapping code and name details.
- **SystemConfig**: Stores category-scoped configuration key-values.

## GraphQL API Reference

### Queries

- `hospital(id: ID): Hospital!`
  - Returns hospital detail.
- `branches: [Branch!]!`
  - List all branches.
- `departments: [Department!]!`
  - List all departments.
- `systemConfig: [SystemConfig!]!`
  - Returns all system default settings.

### Mutations

- `updateHospital(input: UpdateHospitalInput!, id: ID): Hospital!`
  - Updates hospital profile details.
- `createBranch(input: CreateBranchInput!): Branch!`
  - Creates a new branch.
- `updateBranch(id: ID!, input: UpdateBranchInput!): Branch!`
  - Updates branch name, address, or active state.
- `createDepartment(input: CreateDepartmentInput!): Department!`
  - Creates a department.
- `updateDepartment(id: ID!, input: UpdateDepartmentInput!): Department!`
  - Updates department metadata or active state.
- `updateConfig(key: String!, value: String!): SystemConfig!`
  - Modifies a config key value.
- `updateUserLocale(locale: String!): Boolean!`
  - Sets the user language selection in the database.

## Zod Schemas

Located in `packages/validators/src/config.schema.ts`:

- `updateHospitalSchema`: Validates name, address, phone formatting, and website.
- `createBranchSchema` / `updateBranchSchema`: Validates branch name and address info.
- `createDepartmentSchema` / `updateDepartmentSchema`: Validates uppercase department codes and
  metadata.

## Seeders

Idempotent seeders are provided for initial deployments:

- `01-hospitals.seed.ts`: Inserts the default hospital structure.
- `04-departments.seed.ts`: Seeds core department options (e.g. `CARD`, `EMER`).
- `23-system-config.seed.ts`: Populates standard settings values.
