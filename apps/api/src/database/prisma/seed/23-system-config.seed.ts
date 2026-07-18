import { PrismaClient } from '@prisma/client';

export async function seedSystemConfig(
  prisma: PrismaClient,
  hospital: { id: string },
): Promise<any> {
  const configs = [
    {
      key: 'site_name',
      value: 'Aurevix General Hospital',
      dataType: 'string',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'timezone',
      value: 'Asia/Dhaka',
      dataType: 'string',
      category: 'general',
      isPublic: true,
    },
    { key: 'currency', value: 'BDT', dataType: 'string', category: 'general', isPublic: true },
    { key: 'currency_symbol', value: '৳', dataType: 'string', category: 'general', isPublic: true },
    {
      key: 'appointment_slot_duration_minutes',
      value: '15',
      dataType: 'number',
      category: 'appointment',
      isPublic: true,
    },
    {
      key: 'max_failed_login_attempts',
      value: '5',
      dataType: 'number',
      category: 'security',
      isPublic: false,
    },
    {
      key: 'lockout_cooldown_minutes',
      value: '15',
      dataType: 'number',
      category: 'security',
      isPublic: false,
    },
    {
      key: 'queue_prefix_opd',
      value: 'OPD-',
      dataType: 'string',
      category: 'appointment',
      isPublic: true,
    },
    {
      key: 'mfa_enforced_roles',
      value: 'SUPER_ADMIN,ADMIN,DOCTOR,PHARMACIST',
      dataType: 'string',
      category: 'security',
      isPublic: false,
    },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: {
        hospitalId_key: {
          hospitalId: hospital.id,
          key: c.key,
        },
      },
      update: {
        value: c.value,
        dataType: c.dataType,
        category: c.category,
        isPublic: c.isPublic,
      },
      create: {
        hospitalId: hospital.id,
        key: c.key,
        value: c.value,
        dataType: c.dataType,
        category: c.category,
        isPublic: c.isPublic,
      },
    });
  }
}
