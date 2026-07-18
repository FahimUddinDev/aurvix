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

export async function seedUsers(
  prisma: PrismaClient,
  hospital: { id: string },
  roles: { id: string; name: string }[],
) {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  const getRole = (name: string) => roles.find((r) => r.name === name)!;

  const usersData = [
    {
      id: 'user-001',
      email: 'admin@aurevix.com',
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+8801700000001',
    },
    {
      id: 'user-002',
      email: 'dr.rahim@aurevix.com',
      firstName: 'Abdur',
      lastName: 'Rahim',
      role: 'DOCTOR',
      phone: '+8801700000002',
    },
    {
      id: 'user-003',
      email: 'dr.karim@aurevix.com',
      firstName: 'Abdul',
      lastName: 'Karim',
      role: 'DOCTOR',
      phone: '+8801700000003',
    },
    {
      id: 'user-004',
      email: 'dr.fatema@aurevix.com',
      firstName: 'Fatema',
      lastName: 'Begum',
      role: 'DOCTOR',
      phone: '+8801700000004',
    },
    {
      id: 'user-005',
      email: 'reception@aurevix.com',
      firstName: 'Nasrin',
      lastName: 'Akter',
      role: 'RECEPTIONIST',
      phone: '+8801700000005',
    },
    {
      id: 'user-006',
      email: 'nurse.fatima@aurevix.com',
      firstName: 'Fatima',
      lastName: 'Khatun',
      role: 'NURSE',
      phone: '+8801700000006',
    },
    {
      id: 'user-007',
      email: 'lab@aurevix.com',
      firstName: 'Rafiqul',
      lastName: 'Islam',
      role: 'LAB_TECHNICIAN',
      phone: '+8801700000007',
    },
    {
      id: 'user-008',
      email: 'pharmacy@aurevix.com',
      firstName: 'Minhaj',
      lastName: 'Ahmed',
      role: 'PHARMACIST',
      phone: '+8801700000008',
    },
    {
      id: 'user-009',
      email: 'accounts@aurevix.com',
      firstName: 'Shahidul',
      lastName: 'Islam',
      role: 'ACCOUNTANT',
      phone: '+8801700000009',
    },
    {
      id: 'user-010',
      email: 'hr@aurevix.com',
      firstName: 'Sumaiya',
      lastName: 'Begum',
      role: 'HR_MANAGER',
      phone: '+8801700000010',
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        hospitalId: hospital.id,
        roleId: getRole(u.role).id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        status: 'ACTIVE',
        locale: 'en',
      },
    });
    users.push(user);
  }

  return users;
}
