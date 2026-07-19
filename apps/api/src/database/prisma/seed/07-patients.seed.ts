import { PrismaClient, Gender } from '@prisma/client';

export async function seedPatients(prisma: PrismaClient, hospital: { id: string }): Promise<any[]> {
  const patientsData = [
    {
      uhid: 'P-2026-00001',
      firstName: 'Kabir',
      lastName: 'Hasan',
      firstNameBn: 'কবির',
      lastNameBn: 'হাসান',
      dateOfBirth: new Date('1985-05-12'),
      gender: Gender.MALE,
      phone: '+8801711223344',
      email: 'kabir.hasan@example.com',
      address: 'Mirpur-10, Dhaka',
    },
    {
      uhid: 'P-2026-00002',
      firstName: 'Fatema',
      lastName: 'Khatun',
      firstNameBn: 'ফাতেমা',
      lastNameBn: 'খাতুন',
      dateOfBirth: new Date('1990-08-22'),
      gender: Gender.FEMALE,
      phone: '+8801811223344',
      email: 'fatema.khatun@example.com',
      address: 'Dhanmondi, Dhaka',
    },
    {
      uhid: 'P-2026-00003',
      firstName: 'Abdur',
      lastName: 'Rahman',
      firstNameBn: 'আব্দুর',
      lastNameBn: 'রহমান',
      dateOfBirth: new Date('1965-02-15'),
      gender: Gender.MALE,
      phone: '+8801911223344',
      email: 'abdur.rahman@example.com',
      address: 'Uttara, Dhaka',
    },
    {
      uhid: 'P-2026-00004',
      firstName: 'Tanya',
      lastName: 'Chowdhury',
      firstNameBn: 'তানিয়া',
      lastNameBn: 'চৌধুরী',
      dateOfBirth: new Date('1998-11-30'),
      gender: Gender.FEMALE,
      phone: '+8801511223344',
      email: 'tanya.c@example.com',
      address: 'Banani, Dhaka',
    },
    {
      uhid: 'P-2026-00005',
      firstName: 'Aayan',
      lastName: 'Ahmed',
      firstNameBn: 'আয়ান',
      lastNameBn: 'আহমেদ',
      dateOfBirth: new Date('2015-04-05'),
      gender: Gender.MALE,
      phone: '+8801611223344',
      email: 'aayan.ahmed@example.com',
      address: 'Gulshan, Dhaka',
    },
  ];

  const seededPatients = [];

  for (const p of patientsData) {
    const patient = await prisma.patient.upsert({
      where: { uhid: p.uhid },
      update: {},
      create: {
        hospitalId: hospital.id,
        uhid: p.uhid,
        firstName: p.firstName,
        lastName: p.lastName,
        firstNameBn: p.firstNameBn,
        lastNameBn: p.lastNameBn,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        isActive: true,
      },
    });
    seededPatients.push(patient);
  }

  return seededPatients;
}
