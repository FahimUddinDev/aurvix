import { PrismaClient } from '@prisma/client';

export async function seedMedicines(prisma: PrismaClient, hospital: { id: string }): Promise<any[]> {
  const medicinesData = [
    {
      genericName: 'Paracetamol',
      brandName: 'Napa Extend',
      category: 'Analgesics',
      dosageForm: 'Tablet',
      strength: '665mg',
      manufacturer: 'Beximco Pharmaceuticals',
      unitPrice: 1.5,
    },
    {
      genericName: 'Omeprazole',
      brandName: 'Losectil',
      category: 'Antacids/Antiulcerants',
      dosageForm: 'Capsule',
      strength: '20mg',
      manufacturer: 'Square Pharmaceuticals',
      unitPrice: 5.0,
    },
    {
      genericName: 'Metformin Hydrochloride',
      brandName: 'Comet',
      category: 'Antidiabetics',
      dosageForm: 'Tablet',
      strength: '850mg',
      manufacturer: 'Incepta Pharmaceuticals',
      unitPrice: 6.0,
    },
    {
      genericName: 'Amlodipine Besylate',
      brandName: 'Camlodin',
      category: 'Antihypertensives',
      dosageForm: 'Tablet',
      strength: '5mg',
      manufacturer: 'Square Pharmaceuticals',
      unitPrice: 4.5,
    },
    {
      genericName: 'Amoxicillin Trihydrate',
      brandName: 'Moxacil',
      category: 'Antibiotics',
      dosageForm: 'Capsule',
      strength: '500mg',
      manufacturer: 'Beximco Pharmaceuticals',
      unitPrice: 8.0,
    },
    {
      genericName: 'Atorvastatin',
      brandName: 'Anova',
      category: 'Lipid Lowering Drugs',
      dosageForm: 'Tablet',
      strength: '10mg',
      manufacturer: 'Incepta Pharmaceuticals',
      unitPrice: 12.0,
    },
    {
      genericName: 'Salbutamol',
      brandName: 'Windel',
      category: 'Bronchodilators',
      dosageForm: 'Syrup',
      strength: '2mg/5ml',
      manufacturer: 'Beximco Pharmaceuticals',
      unitPrice: 35.0,
    },
    {
      genericName: 'Esomeprazole Magnesium',
      brandName: 'Maxpro',
      category: 'Antacids/Antiulcerants',
      dosageForm: 'Tablet',
      strength: '20mg',
      manufacturer: 'Renata Limited',
      unitPrice: 7.0,
    },
    {
      genericName: 'Pantoprazole',
      brandName: 'Pantonic',
      category: 'Antacids/Antiulcerants',
      dosageForm: 'Tablet',
      strength: '40mg',
      manufacturer: 'Square Pharmaceuticals',
      unitPrice: 8.0,
    },
    {
      genericName: 'Losartan Potassium',
      brandName: 'Angilock',
      category: 'Antihypertensives',
      dosageForm: 'Tablet',
      strength: '50mg',
      manufacturer: 'Square Pharmaceuticals',
      unitPrice: 7.5,
    },
  ];

  const seededMedicines = [];

  for (const m of medicinesData) {
    const medId = `00000000-0000-0000-0002-${String(medicinesData.indexOf(m) + 1).padStart(12, '0')}`;
    const med = await prisma.medicine.upsert({
      where: {
        id: medId,
      },
      update: {},
      create: {
        id: medId,
        hospitalId: hospital.id,
        genericName: m.genericName,
        brandName: m.brandName,
        category: m.category,
        dosageForm: m.dosageForm,
        strength: m.strength,
        manufacturer: m.manufacturer,
        unitPrice: m.unitPrice,
        isActive: true,
      },
    });
    seededMedicines.push(med);
  }

  return seededMedicines;
}
