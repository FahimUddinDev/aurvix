import { PrismaClient } from '@prisma/client';

export async function seedInventory(prisma: PrismaClient, hospital: { id: string }): Promise<any> {
  const medicines = await prisma.medicine.findMany({
    where: { hospitalId: hospital.id },
  });

  if (medicines.length === 0) {
    throw new Error('No medicines found. Seed medicines before seeding inventory batches.');
  }

  for (const med of medicines) {
    const medIdx = medicines.indexOf(med);

    // Batch 1: Near expiry (e.g., in 30 days)
    const expiry1 = new Date();
    expiry1.setDate(expiry1.getDate() + 30);

    const batch1Id = `00000000-0000-0000-0008-${String(medIdx * 2 + 1).padStart(12, '0')}`;
    await prisma.stockBatch.upsert({
      where: { id: batch1Id },
      update: {},
      create: {
        id: batch1Id,
        hospitalId: hospital.id,
        medicineId: med.id,
        batchNumber: `BAT-${med.brandName?.slice(0, 3).toUpperCase() || 'MED'}-001`,
        expiryDate: expiry1,
        qty: 150,
        unitCost: 10.0,
      },
    });

    // Batch 2: Far expiry (e.g., in 365 days)
    const expiry2 = new Date();
    expiry2.setDate(expiry2.getDate() + 365);

    const batch2Id = `00000000-0000-0000-0008-${String(medIdx * 2 + 2).padStart(12, '0')}`;
    await prisma.stockBatch.upsert({
      where: { id: batch2Id },
      update: {},
      create: {
        id: batch2Id,
        hospitalId: hospital.id,
        medicineId: med.id,
        batchNumber: `BAT-${med.brandName?.slice(0, 3).toUpperCase() || 'MED'}-002`,
        expiryDate: expiry2,
        qty: 500,
        unitCost: 12.0,
      },
    });
  }
}
