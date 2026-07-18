import { PrismaClient, BedStatus } from '@prisma/client';

export async function seedWardsBeds(prisma: PrismaClient, hospital: any) {
  const wardData = [
    {
      id: '00000000-0000-0000-0000-000000000111',
      name: 'Male General Ward',
      nameBn: 'পুরুষ সাধারণ ওয়ার্ড',
      type: 'GENERAL',
      floor: '3rd Floor',
      dailyRate: 1500,
    },
    {
      id: '00000000-0000-0000-0000-000000000112',
      name: 'Female General Ward',
      nameBn: 'মহিলা সাধারণ ওয়ার্ড',
      type: 'GENERAL',
      floor: '3rd Floor',
      dailyRate: 1500,
    },
    {
      id: '00000000-0000-0000-0000-000000000113',
      name: 'Intensive Care Unit (ICU)',
      nameBn: 'আইসিইউ',
      type: 'ICU',
      floor: '4th Floor',
      dailyRate: 10000,
    },
  ];

  const wards = [];
  const beds = [];

  for (const w of wardData) {
    const ward = await prisma.ward.upsert({
      where: { id: w.id },
      update: {
        name: w.name,
        nameBn: w.nameBn,
        type: w.type,
        floor: w.floor,
        dailyRate: w.dailyRate,
      },
      create: {
        id: w.id,
        hospitalId: hospital.id,
        name: w.name,
        nameBn: w.nameBn,
        type: w.type,
        floor: w.floor,
        dailyRate: w.dailyRate,
      },
    });
    wards.push(ward);

    // Create 5 beds for each ward deterministically
    const wardSuffix = w.id.slice(-3); // "111", "112", "113"
    for (let i = 1; i <= 5; i++) {
      const bedNumber = `${w.type.substring(0, 3)}-${100 + i}`;
      const bedId = `00000000-0000-0000-0000-0000000${wardSuffix}0${i}`;
      const bed = await prisma.bed.upsert({
        where: { id: bedId },
        update: {
          bedNumber,
        },
        create: {
          id: bedId,
          hospitalId: hospital.id,
          wardId: ward.id,
          bedNumber,
          status: BedStatus.AVAILABLE,
        },
      });
      beds.push(bed);
    }
  }

  return { wards, beds };
}
