import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const DEMO_PASSWORD = 'Demo@123';

export async function seedRolesPermissions(prisma: PrismaClient) {
  const roleData = [
    { id: 'role-001', name: 'SUPER_ADMIN', displayName: 'Super Administrator' },
    { id: 'role-002', name: 'ADMIN', displayName: 'Administrator' },
    { id: 'role-003', name: 'DOCTOR', displayName: 'Doctor' },
    { id: 'role-004', name: 'NURSE', displayName: 'Nurse' },
    { id: 'role-005', name: 'LAB_TECHNICIAN', displayName: 'Lab Technician' },
    { id: 'role-006', name: 'PHARMACIST', displayName: 'Pharmacist' },
    { id: 'role-007', name: 'RECEPTIONIST', displayName: 'Receptionist' },
    { id: 'role-008', name: 'ACCOUNTANT', displayName: 'Accountant' },
    { id: 'role-009', name: 'HR_MANAGER', displayName: 'HR Manager' },
    { id: 'role-010', name: 'RADIOLOGIST', displayName: 'Radiologist' },
  ];

  const roles = [];
  for (const r of roleData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName },
      create: { name: r.name, displayName: r.displayName, isSystem: true },
    });
    roles.push(role);
  }

  const modules = [
    'patient',
    'appointment',
    'emr',
    'prescription',
    'laboratory',
    'radiology',
    'pharmacy',
    'billing',
    'payment',
    'admission',
    'nursing',
    'discharge',
    'hrm',
    'inventory',
    'crm',
    'blood-bank',
    'consent',
    'notification',
    'report',
    'audit',
    'config',
    'user',
    'rbac',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'export'];

  const permissions = [];
  for (const mod of modules) {
    for (const action of actions) {
      const name = `${mod}:${action}`;
      const perm = await prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          displayName: `${action.charAt(0).toUpperCase() + action.slice(1)} ${mod}`,
          module: mod,
          action,
        },
      });
      permissions.push(perm);
    }
  }

  return { roles, permissions };
}


