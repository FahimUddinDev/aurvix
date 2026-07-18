import { PrismaClient } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient, hospital: { id: string }) {
  const depts = [
    { code: 'CARD', name: 'Cardiology', nameBn: 'কার্ডিওলজি' },
    { code: 'ORTH', name: 'Orthopedics', nameBn: 'অর্থোপেডিক্স' },
    { code: 'PEDS', name: 'Pediatrics', nameBn: 'শিশু বিভাগ' },
    { code: 'GYNE', name: 'Gynecology & Obstetrics', nameBn: 'স্ত্রীরোগ ও প্রসূতি' },
    { code: 'GMED', name: 'General Medicine', nameBn: 'সাধারণ মেডিসিন' },
    { code: 'SURG', name: 'General Surgery', nameBn: 'সাধারণ শল্যচিকিৎসা' },
    { code: 'ENT', name: 'ENT', nameBn: 'কান-নাক-গলা' },
    { code: 'OPTH', name: 'Ophthalmology', nameBn: 'চক্ষু বিভাগ' },
    { code: 'DERM', name: 'Dermatology', nameBn: 'চর্মরোগ বিভাগ' },
    { code: 'NEUR', name: 'Neurology', nameBn: 'স্নায়ুরোগ বিভাগ' },
    { code: 'UROL', name: 'Urology', nameBn: 'মূত্রতন্ত্র বিভাগ' },
    { code: 'PSYC', name: 'Psychiatry', nameBn: 'মানসিক স্বাস্থ্য বিভাগ' },
    { code: 'DENT', name: 'Dental', nameBn: 'দন্ত বিভাগ' },
    { code: 'EMER', name: 'Emergency', nameBn: 'জরুরি বিভাগ' },
    { code: 'ICU', name: 'ICU / Critical Care', nameBn: 'নিবিড় পরিচর্যা' },
  ];

  const departments = [];
  for (const d of depts) {
    const dept = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: d.code } },
      update: { name: d.name, nameBn: d.nameBn },
      create: {
        hospitalId: hospital.id,
        code: d.code,
        name: d.name,
        nameBn: d.nameBn,
        isActive: true,
      },
    });
    departments.push(dept);
  }
  return departments;
}
