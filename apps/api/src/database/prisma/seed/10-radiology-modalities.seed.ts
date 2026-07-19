import { PrismaClient } from '@prisma/client';

export async function seedRadiologyModalities(prisma: PrismaClient, hospital: { id: string }): Promise<any[]> {
  const modalitiesData = [
    {
      name: 'Chest X-Ray (P/A View)',
      nameBn: 'বুকের এক্স-রে',
      code: 'RAD-XRAY-CHEST',
      description: 'Standard posterior-anterior chest X-Ray evaluating lungs and heart outline.',
      price: 500,
    },
    {
      name: 'MRI of Brain (Plain)',
      nameBn: 'মস্তিষ্কের এমআরআই',
      code: 'RAD-MRI-BRAIN',
      description: 'High-resolution magnetic resonance imaging of brain parenchyma.',
      price: 7000,
    },
    {
      name: 'CT Scan of Abdomen (With Contrast)',
      nameBn: 'পেটের সিটি স্ক্যান',
      code: 'RAD-CT-ABD',
      description: 'Computed tomography of abdomen and pelvis with IV contrast media.',
      price: 6000,
    },
    {
      name: 'USG of Whole Abdomen',
      nameBn: 'পেটের আল্ট্রাসনোগ্রাফি',
      code: 'RAD-USG-WA',
      description: 'Ultrasonography evaluating liver, kidneys, spleen, pancreas, gallbladder, and bladder.',
      price: 1200,
    },
    {
      name: 'Mammography (Bilateral)',
      nameBn: 'ম্যামোগ্রাফি',
      code: 'RAD-MAM-BIL',
      description: 'Low-dose X-ray screening of bilateral breast tissues.',
      price: 2500,
    },
  ];

  const seededModalities = [];

  for (const m of modalitiesData) {
    const modalityId = `00000000-0000-0000-0007-${String(modalitiesData.indexOf(m) + 1).padStart(12, '0')}`;
    const modality = await prisma.radiologyModality.upsert({
      where: { id: modalityId },
      update: {},
      create: {
        id: modalityId,
        hospitalId: hospital.id,
        name: m.name,
        nameBn: m.nameBn,
        code: m.code,
        description: m.description,
        price: m.price,
        isActive: true,
      },
    });
    seededModalities.push(modality);
  }

  return seededModalities;
}
