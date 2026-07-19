import { PrismaClient, PrescriptionStatus } from '@prisma/client';

export async function seedVisitsPrescriptions(
  prisma: PrismaClient,
  hospital: { id: string },
  patients: any[],
  doctors: any[],
  appointments: any[],
  medicines: any[],
  departments: any[],
) {
  if (!patients || patients.length === 0 || !doctors || doctors.length === 0 || !medicines || medicines.length === 0) {
    throw new Error('Required patients, doctors, and medicines must be pre-seeded before visits.');
  }

  const seededVisits = [];

  const complaints = [
    'Persistent dry cough and fever for 3 days',
    'Severe lower back pain radiating to left leg',
    'Routine diabetes checkup and generic medication refill',
    'Chest discomfort and mild palpitation after exertion',
    'Recurrent headache and blurred vision',
  ];

  const soapNotes = [
    'Subjective: Patient reports productive cough with yellow sputum.\nObjective: Bilateral wheezing present, Temp 38.1 C.\nAssessment: Acute Bronchitis.\nPlan: Prescribe antibiotics, recommend rest.',
    'Subjective: Chronic lower back pain, worse after sitting.\nObjective: Lumbar spine tenderness, ROM restricted.\nAssessment: Mechanical low back pain.\nPlan: Refer to physical therapy, prescribe NSAIDs.',
    'Subjective: Routine follow up for Type 2 Diabetes.\nObjective: HbA1c 7.1%, BP 130/80 mmHg.\nAssessment: Controlled Type 2 Diabetes Mellitus.\nPlan: Continue current Metformin, adjust diet.',
    'Subjective: Shortness of breath on walking up stairs.\nObjective: BP 145/95 mmHg, HR 82 bpm.\nAssessment: Stage 2 Essential Hypertension.\nPlan: Start antihypertensive medication.',
    'Subjective: Patient complains of migraine headaches twice a week.\nObjective: Visual acuity normal, neurological exam intact.\nAssessment: Migraine without aura.\nPlan: Prescribe abortive medicine, keep headache diary.',
  ];

  const diagnoses = [
    { code: 'J20.9', desc: 'Acute bronchitis, unspecified' },
    { code: 'M54.5', desc: 'Low back pain' },
    { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
    { code: 'I10', desc: 'Essential (primary) hypertension' },
    { code: 'G43.909', desc: 'Migraine, unspecified, not intractable' },
  ];

  // Seed 10 visits
  for (let idx = 0; idx < 10; idx++) {
    const patient = patients[idx % patients.length]!;
    const doctor = doctors[idx % doctors.length]!;
    const dept = departments[idx % departments.length]!;

    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() - (idx + 1)); // Past dates

    const complaint = complaints[idx % complaints.length]!;
    const noteContent = soapNotes[idx % soapNotes.length]!;
    const diag = diagnoses[idx % diagnoses.length]!;

    const visitId = `00000000-0000-0000-0003-${String(idx + 1).padStart(12, '0')}`;

    const visit = await prisma.visit.upsert({
      where: { id: visitId },
      update: {},
      create: {
        id: visitId,
        hospitalId: hospital.id,
        patientId: patient.id,
        doctorId: doctor.id,
        departmentId: doctor.departmentId || dept.id,
        visitDate,
        chiefComplaint: complaint,
        isCompleted: true,
        completedAt: visitDate,
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create vital sign
    await prisma.vitalSign.create({
      data: {
        hospitalId: hospital.id,
        visitId: visit.id,
        systolicBp: 120 + (idx % 3) * 10,
        diastolicBp: 80 + (idx % 3) * 5,
        heartRate: 72 + (idx % 5) * 4,
        temperature: 36.6 + (idx % 4) * 0.4,
        spo2: 98,
        weightKg: 65.5 + idx,
        heightCm: 170.0,
        recordedAt: visitDate,
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create Diagnosis
    await prisma.diagnosis.create({
      data: {
        hospitalId: hospital.id,
        visitId: visit.id,
        icd10Code: diag.code,
        icd10Desc: diag.desc,
        description: 'Confirmed clinical diagnosis',
        isPrimary: true,
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create Clinical Note
    await prisma.clinicalNote.create({
      data: {
        hospitalId: hospital.id,
        visitId: visit.id,
        noteType: 'SOAP',
        content: noteContent,
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create Prescription
    const prescriptionId = `00000000-0000-0000-0004-${String(idx + 1).padStart(12, '0')}`;
    const rx = await prisma.prescription.upsert({
      where: { id: prescriptionId },
      update: {},
      create: {
        id: prescriptionId,
        hospitalId: hospital.id,
        visitId: visit.id,
        patientId: patient.id,
        doctorId: doctor.id,
        status: PrescriptionStatus.ACTIVE,
        notes: 'Take medications regularly as directed.',
        validUntil: new Date(new Date().setDate(visitDate.getDate() + 30)),
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create 2 prescription items per visit
    for (let k = 0; k < 2; k++) {
      const med = medicines[(idx + k) % medicines.length]!;
      await prisma.prescriptionItem.create({
        data: {
          hospitalId: hospital.id,
          prescriptionId: rx.id,
          medicineId: med.id,
          dosage: k === 0 ? '1+0+1' : '0+0+1',
          frequency: 'After Meal',
          duration: '7 Days',
          route: 'ORAL',
          instructions: 'Drink plenty of water.',
          qty: 14,
          createdBy: 'system-seed',
          updatedBy: 'system-seed',
        },
      });
    }

    seededVisits.push(visit);
  }

  return seededVisits;
}
