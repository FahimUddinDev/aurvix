import { PrismaClient, AdmissionStatus, BedStatus } from '@prisma/client';

export async function seedAdmissions(
  prisma: PrismaClient,
  hospital: { id: string },
  patients: any[],
  beds: any[],
  users: any[],
): Promise<any> {
  if (!patients || patients.length < 2 || !beds || beds.length < 2 || !users || users.length === 0) {
    console.log('  [seed] skipping 18-admissions: insufficient patients/beds/users data.');
    return;
  }

  const staffUserId = users[0].id;

  // Admission 1: Active Inpatient Occupancy
  const adm1Id = '00000000-0000-0000-000a-000000000001';
  const bed1 = beds[0];

  await prisma.admission.upsert({
    where: { id: adm1Id },
    update: {},
    create: {
      id: adm1Id,
      hospitalId: hospital.id,
      patientId: patients[0].id,
      bedId: bed1.id,
      admittedBy: staffUserId,
      status: AdmissionStatus.ACTIVE,
      admissionDate: new Date(),
      admissionNotes: 'Severe acute asthma exacerbation - occupy bed for nebulization monitoring.',
      createdBy: 'seed-runner',
      updatedBy: 'seed-runner',
    },
  });

  // Mark bed 1 occupied
  await prisma.bed.update({
    where: { id: bed1.id },
    data: { status: BedStatus.OCCUPIED },
  });

  // Admission 2: Historical Discharged log
  const adm2Id = '00000000-0000-0000-000a-000000000002';
  const bed2 = beds[1];

  const admissionDate = new Date();
  admissionDate.setDate(admissionDate.getDate() - 5);
  const dischargeDate = new Date();
  dischargeDate.setDate(dischargeDate.getDate() - 1);

  await prisma.admission.upsert({
    where: { id: adm2Id },
    update: {},
    create: {
      id: adm2Id,
      hospitalId: hospital.id,
      patientId: patients[1].id,
      bedId: bed2.id,
      admittedBy: staffUserId,
      status: AdmissionStatus.DISCHARGED,
      admissionDate,
      dischargeDate,
      admissionNotes: 'Post-op observation - discharged home after normal vitals checks.',
      createdBy: 'seed-runner',
      updatedBy: 'seed-runner',
    },
  });

  // Mark bed 2 available
  await prisma.bed.update({
    where: { id: bed2.id },
    data: { status: BedStatus.AVAILABLE },
  });
}
