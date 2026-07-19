import { PrismaClient, LabOrderStatus, ResultFlag } from '@prisma/client';

export async function seedLabOrdersResults(
  prisma: PrismaClient,
  hospital: { id: string },
  labTests: any[],
  patients: any[],
  doctors: any[],
) {
  if (!labTests || labTests.length === 0 || !patients || patients.length === 0 || !doctors || doctors.length === 0) {
    throw new Error('Required lab tests, patients, and doctors must be seeded before lab orders.');
  }

  const seededOrders = [];

  const statuses = [
    LabOrderStatus.PENDING,
    LabOrderStatus.SAMPLE_COLLECTED,
    LabOrderStatus.RESULTED,
    LabOrderStatus.APPROVED,
    LabOrderStatus.REJECTED,
  ];

  // We need visits to link lab orders to. Let's retrieve seeded visits.
  const visits = await prisma.visit.findMany({
    where: { hospitalId: hospital.id },
  });

  if (visits.length === 0) {
    throw new Error('No visits found in database. Seed visits before seeding lab orders.');
  }

  let index = 0;
  for (let i = 0; i < 30; i++) {
    const patient = patients[i % patients.length]!;
    const doctor = doctors[i % doctors.length]!;
    const visit = visits[i % visits.length]!;
    const test = labTests[i % labTests.length]!;
    const status = statuses[i % statuses.length]!;

    const orderId = `00000000-0000-0000-0006-${String(i + 1).padStart(12, '0')}`;

    const order = await prisma.labOrder.upsert({
      where: { id: orderId },
      update: {},
      create: {
        id: orderId,
        hospitalId: hospital.id,
        visitId: visit.id,
        patientId: patient.id,
        doctorId: doctor.id,
        status,
        priority: i % 5 === 0 ? 'URGENT' : 'ROUTINE',
        notes: 'Routine outpatient laboratory evaluation.',
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // Create item link
    await prisma.labOrderItem.create({
      data: {
        hospitalId: hospital.id,
        orderId: order.id,
        testId: test.id,
        createdBy: 'system-seed',
        updatedBy: 'system-seed',
      },
    });

    // If sample collected or resulted/approved, seed sample
    if (status !== LabOrderStatus.PENDING) {
      await prisma.labSample.upsert({
        where: { barcode: `BAR-${orderId.slice(-6)}-${i}` },
        update: {},
        create: {
          hospitalId: hospital.id,
          orderId: order.id,
          barcode: `BAR-${orderId.slice(-6)}-${i}`,
          sampleType: test.sampleType,
          collectedAt: new Date(),
          collectedBy: doctor.userId || doctor.id,
          createdBy: 'system-seed',
          updatedBy: 'system-seed',
        },
      });
    }

    // If resulted or approved, seed results
    if (status === LabOrderStatus.RESULTED || status === LabOrderStatus.APPROVED) {
      const isCritical = i % 4 === 0;
      let value = '14.0'; // Normal default
      let flag: ResultFlag = ResultFlag.NORMAL;

      if (test.code === 'HEM-HB') {
        value = isCritical ? '6.5' : '14.5';
        flag = isCritical ? ResultFlag.CRITICAL_LOW : ResultFlag.NORMAL;
      } else if (test.code === 'BIO-CRE') {
        value = isCritical ? '3.8' : '0.9';
        flag = isCritical ? ResultFlag.CRITICAL_HIGH : ResultFlag.NORMAL;
      } else if (test.code === 'BIO-RBS') {
        value = isCritical ? '350' : '95';
        flag = isCritical ? ResultFlag.CRITICAL_HIGH : ResultFlag.NORMAL;
      }

      const normalRangeStr = patient.gender === 'FEMALE' ? test.normalRangeFemale : test.normalRangeMale;

      await prisma.labResult.create({
        data: {
          hospitalId: hospital.id,
          orderId: order.id,
          testId: test.id,
          value,
          unit: test.unit || '',
          flag,
          normalRange: normalRangeStr || '',
          remarks: flag === ResultFlag.NORMAL ? 'Within normal range' : 'Needs urgent clinical attention',
          enteredBy: doctor.userId || doctor.id,
          approvedBy: status === LabOrderStatus.APPROVED ? (doctor.userId || doctor.id) : null,
          approvedAt: status === LabOrderStatus.APPROVED ? new Date() : null,
          createdBy: 'system-seed',
          updatedBy: 'system-seed',
        },
      });
    }

    seededOrders.push(order);
  }

  return seededOrders;
}
