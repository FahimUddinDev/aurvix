import { PrismaClient } from '@prisma/client';

export async function seedHospitals(prisma: PrismaClient) {
  const hospital = await prisma.hospital.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Aurevix General Hospital',
      nameBn: 'অরেভিক্স জেনারেল হাসপাতাল',
      address: 'House 12, Road 7, Gulshan-2, Dhaka-1212, Bangladesh',
      addressBn: 'বাড়ি ১২, রোড ৭, গুলশান-২, ঢাকা-১২১২, বাংলাদেশ',
      phone: '+880-2-55045678',
      email: 'info@aurevix.com',
      website: 'https://aurevix.com',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      uhidPrefix: 'AV',
      isActive: true,
    },
  });

  // Dhaka Branch (same as main)
  await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      hospitalId: hospital.id,
      name: 'Dhaka Main Branch',
      nameBn: 'ঢাকা মেইন শাখা',
      address: 'House 12, Road 7, Gulshan-2, Dhaka-1212',
      phone: '+880-2-55045678',
      isActive: true,
    },
  });

  // Chittagong Branch
  await prisma.branch.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      hospitalId: hospital.id,
      name: 'Chittagong Branch',
      nameBn: 'চট্টগ্রাম শাখা',
      address: 'Plot 45, Agrabad Commercial Area, Chittagong-4100',
      phone: '+880-31-2551234',
      isActive: true,
    },
  });

  return hospital;
}
