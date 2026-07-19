import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const DEMO_PASSWORD = 'Demo@123';

export async function seedDoctors(
  prisma: PrismaClient,
  hospital: { id: string },
  departments: any[],
  users: any[],
) {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  const doctorRole = await prisma.role.findUnique({ where: { name: 'DOCTOR' } });
  if (!doctorRole) throw new Error('DOCTOR role not found in database');

  const deptMap = new Map(departments.map((d) => [d.code, d.id]));

  // 12 Doctors database mapping
  const doctorsData = [
    {
      userId: 'user-002', // Pre-seeded in 03-users
      email: 'dr.rahim@aurevix.com',
      firstName: 'Abdur',
      lastName: 'Rahim',
      phone: '+8801700000002',
      deptCode: 'CARD',
      bmdcNumber: 'A-45129',
      specialization: 'Interventional Cardiology',
      qualification: 'MBBS, MD (Cardiology)',
      experience: 15,
      consultationFee: 1000,
    },
    {
      userId: 'user-003', // Pre-seeded in 03-users
      email: 'dr.karim@aurevix.com',
      firstName: 'Abdul',
      lastName: 'Karim',
      phone: '+8801700000003',
      deptCode: 'ORTH',
      bmdcNumber: 'A-38291',
      specialization: 'Orthopedic Surgery & Trauma',
      qualification: 'MBBS, MS (Orthopedics)',
      experience: 12,
      consultationFee: 800,
    },
    {
      userId: 'user-004', // Pre-seeded in 03-users
      email: 'dr.fatema@aurevix.com',
      firstName: 'Fatema',
      lastName: 'Begum',
      phone: '+8801700000004',
      deptCode: 'GYNE',
      bmdcNumber: 'A-51022',
      specialization: 'Gynecology & Obstetrics',
      qualification: 'MBBS, FCPS (Gyne)',
      experience: 10,
      consultationFee: 800,
    },
    {
      userId: 'user-doctor-4',
      email: 'dr.shah@aurevix.com',
      firstName: 'Shah',
      lastName: 'Alam',
      phone: '+8801700000024',
      deptCode: 'PEDS',
      bmdcNumber: 'A-61921',
      specialization: 'Pediatric Neonatology',
      qualification: 'MBBS, FCPS (Pediatrics), MD',
      experience: 8,
      consultationFee: 700,
    },
    {
      userId: 'user-doctor-5',
      email: 'dr.rokeya@aurevix.com',
      firstName: 'Rokeya',
      lastName: 'Rahman',
      phone: '+8801700000025',
      deptCode: 'GMED',
      bmdcNumber: 'A-32981',
      specialization: 'Internal Medicine',
      qualification: 'MBBS, FCPS (Medicine)',
      experience: 18,
      consultationFee: 1200,
    },
    {
      userId: 'user-doctor-6',
      email: 'dr.arif@aurevix.com',
      firstName: 'Arifur',
      lastName: 'Rahman',
      phone: '+8801700000026',
      deptCode: 'SURG',
      bmdcNumber: 'A-49281',
      specialization: 'Laparoscopic Surgery',
      qualification: 'MBBS, MS (Surgery)',
      experience: 11,
      consultationFee: 900,
    },
    {
      userId: 'user-doctor-7',
      email: 'dr.tasnim@aurevix.com',
      firstName: 'Tasnim',
      lastName: 'Ara',
      phone: '+8801700000027',
      deptCode: 'DERM',
      bmdcNumber: 'A-56023',
      specialization: 'Clinical Dermatology & Cosmetology',
      qualification: 'MBBS, DDV',
      experience: 7,
      consultationFee: 700,
    },
    {
      userId: 'user-doctor-8',
      email: 'dr.kamrul@aurevix.com',
      firstName: 'Kamrul',
      lastName: 'Hasan',
      phone: '+8801700000028',
      deptCode: 'NEUR',
      bmdcNumber: 'A-42109',
      specialization: 'Clinical Neurology',
      qualification: 'MBBS, MD (Neurology)',
      experience: 14,
      consultationFee: 1000,
    },
    {
      userId: 'user-doctor-9',
      email: 'dr.nazmul@aurevix.com',
      firstName: 'Nazmul',
      lastName: 'Islam',
      phone: '+8801700000029',
      deptCode: 'ENT',
      bmdcNumber: 'A-39908',
      specialization: 'Otolaryngology (ENT)',
      qualification: 'MBBS, DLO, MS (ENT)',
      experience: 13,
      consultationFee: 800,
    },
    {
      userId: 'user-doctor-10',
      email: 'dr.sayeda@aurevix.com',
      firstName: 'Sayeda',
      lastName: 'Akter',
      phone: '+8801700000030',
      deptCode: 'OPTH',
      bmdcNumber: 'A-47213',
      specialization: 'Ophthalmology (Cataract & Glaucoma)',
      qualification: 'MBBS, MS (Ophthalmology)',
      experience: 9,
      consultationFee: 600,
    },
    {
      userId: 'user-doctor-11',
      email: 'dr.farhana@aurevix.com',
      firstName: 'Farhana',
      lastName: 'Khan',
      phone: '+8801700000031',
      deptCode: 'PSYC',
      bmdcNumber: 'A-52319',
      specialization: 'Psychiatry & Mental Health',
      qualification: 'MBBS, MD (Psychiatry)',
      experience: 8,
      consultationFee: 800,
    },
    {
      userId: 'user-doctor-12',
      email: 'dr.tariq@aurevix.com',
      firstName: 'Tariqul',
      lastName: 'Islam',
      phone: '+8801700000032',
      deptCode: 'DENT',
      bmdcNumber: 'A-31289',
      specialization: 'Oral & Maxillofacial Surgery',
      qualification: 'BDS, MS (Dental)',
      experience: 16,
      consultationFee: 600,
    },
  ];

  const seededDoctors = [];

  for (const d of doctorsData) {
    // 1. Ensure user account exists
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        hospitalId: hospital.id,
        roleId: doctorRole.id,
        email: d.email,
        passwordHash,
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone,
        status: 'ACTIVE',
        locale: 'en',
      },
    });

    const deptId = deptMap.get(d.deptCode);
    if (!deptId) throw new Error(`Department ${d.deptCode} not found in database`);

    // 2. Ensure doctor profile exists
    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {
        departmentId: deptId,
        bmdcNumber: d.bmdcNumber,
        specialization: d.specialization,
        qualification: d.qualification,
        experience: d.experience,
        consultationFee: d.consultationFee,
      },
      create: {
        hospitalId: hospital.id,
        userId: user.id,
        departmentId: deptId,
        bmdcNumber: d.bmdcNumber,
        specialization: d.specialization,
        qualification: d.qualification,
        experience: d.experience,
        consultationFee: d.consultationFee,
        isActive: true,
      },
    });

    // 3. Populate default schedules (Sunday to Thursday)
    for (let day = 0; day <= 4; day++) {
      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: profile.id,
            dayOfWeek: day,
            startTime: '09:00',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          doctorId: profile.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '13:00',
          slotDurationMin: 15,
          maxPatients: 16,
          isActive: true,
        },
      });

      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: profile.id,
            dayOfWeek: day,
            startTime: '14:00',
          },
        },
        update: {},
        create: {
          hospitalId: hospital.id,
          doctorId: profile.id,
          dayOfWeek: day,
          startTime: '14:00',
          endTime: '17:00',
          slotDurationMin: 15,
          maxPatients: 12,
          isActive: true,
        },
      });
    }

    // 4. Populate default consultation fee
    await prisma.doctorFee.deleteMany({
      where: { doctorId: profile.id },
    });
    await prisma.doctorFee.create({
      data: {
        hospitalId: hospital.id,
        doctorId: profile.id,
        departmentId: deptId,
        feeType: 'CONSULTATION',
        amount: d.consultationFee,
        isActive: true,
      },
    });

    seededDoctors.push(profile);
  }

  return seededDoctors;
}
