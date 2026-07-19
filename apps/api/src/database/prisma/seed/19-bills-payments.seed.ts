import { PrismaClient, BillStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export async function seedBillsPayments(
  prisma: PrismaClient,
  hospital: { id: string },
  patients: any[],
): Promise<any> {
  if (!patients || patients.length < 3) {
    console.log('  [seed] skipping 19-bills-payments: insufficient patients.');
    return;
  }

  // Bill 1: Unpaid (ISSUED)
  const bill1Id = '00000000-0000-0000-0009-000000000001';
  await prisma.bill.upsert({
    where: { id: bill1Id },
    update: {},
    create: {
      id: bill1Id,
      hospitalId: hospital.id,
      patientId: patients[0].id,
      billNo: 'BL-INV-10001',
      status: BillStatus.ISSUED,
      subtotal: 1000.0,
      taxAmount: 50.0,
      discount: 0,
      totalAmount: 1050.0,
      paidAmount: 0,
      dueAmount: 1050.0,
      notes: 'Standard OPD checkout bill',
      createdBy: 'seed-runner',
      updatedBy: 'seed-runner',
      lineItems: {
        create: [
          {
            id: '00000000-0000-0000-0009-100000000001',
            hospitalId: hospital.id,
            description: 'General OPD Consultation Fee',
            qty: 1,
            unitPrice: 1000.0,
            taxPercent: 5.0,
            total: 1050.0,
          },
        ],
      },
    },
  });

  // Bill 2: Partially Paid
  const bill2Id = '00000000-0000-0000-0009-000000000002';
  await prisma.bill.upsert({
    where: { id: bill2Id },
    update: {},
    create: {
      id: bill2Id,
      hospitalId: hospital.id,
      patientId: patients[1].id,
      billNo: 'BL-INV-10002',
      status: BillStatus.PARTIALLY_PAID,
      subtotal: 5500.0,
      taxAmount: 275.0,
      discount: 0,
      totalAmount: 5775.0,
      paidAmount: 2500.0,
      dueAmount: 3275.0,
      notes: 'OPD laboratory & ultrasound bill',
      createdBy: 'seed-runner',
      updatedBy: 'seed-runner',
      lineItems: {
        create: [
          {
            id: '00000000-0000-0000-0009-100000000002',
            hospitalId: hospital.id,
            description: 'Pathology Blood Test Package',
            qty: 1,
            unitPrice: 4000.0,
            taxPercent: 5.0,
            total: 4200.0,
          },
          {
            id: '00000000-0000-0000-0009-100000000003',
            hospitalId: hospital.id,
            description: 'Ultrasonography Scan',
            qty: 1,
            unitPrice: 1500.0,
            taxPercent: 5.0,
            total: 1575.0,
          },
        ],
      },
      payments: {
        create: [
          {
            id: '00000000-0000-0000-0009-200000000001',
            hospitalId: hospital.id,
            method: PaymentMethod.BKASH,
            status: PaymentStatus.COMPLETED,
            amount: 2500.0,
            reference: 'BKX-98721245',
            notes: 'Advance partial deposit',
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  // Bill 3: Fully Settled
  const bill3Id = '00000000-0000-0000-0009-000000000003';
  await prisma.bill.upsert({
    where: { id: bill3Id },
    update: {},
    create: {
      id: bill3Id,
      hospitalId: hospital.id,
      patientId: patients[2].id,
      billNo: 'BL-INV-10003',
      status: BillStatus.PAID,
      subtotal: 7500.0,
      taxAmount: 375.0,
      discount: 375.0, // Discounted tax
      totalAmount: 7500.0,
      paidAmount: 7500.0,
      dueAmount: 0.0,
      notes: 'Cardiac screening package (disc tax)',
      createdBy: 'seed-runner',
      updatedBy: 'seed-runner',
      lineItems: {
        create: [
          {
            id: '00000000-0000-0000-0009-100000000004',
            hospitalId: hospital.id,
            description: 'Cardiac screening Package',
            qty: 1,
            unitPrice: 6000.0,
            taxPercent: 5.0,
            total: 6300.0,
          },
          {
            id: '00000000-0000-0000-0009-100000000005',
            hospitalId: hospital.id,
            description: 'Emergency Specialist consultation',
            qty: 1,
            unitPrice: 1500.0,
            taxPercent: 5.0,
            total: 1575.0,
          },
        ],
      },
      payments: {
        create: [
          {
            id: '00000000-0000-0000-0009-200000000002',
            hospitalId: hospital.id,
            method: PaymentMethod.CASH,
            status: PaymentStatus.COMPLETED,
            amount: 7500.0,
            reference: 'CSH-INV-10003',
            notes: 'Cash drawer settlement',
            paidAt: new Date(),
          },
        ],
      },
    },
  });
}
