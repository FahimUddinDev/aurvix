import { PrismaClient } from '@prisma/client';

export async function seedLeaveAttendance(prisma: PrismaClient) {
  const hospitalId = 'hospital-demo-001'; // demo tenant

  // 1️⃣ Leave Types (Casual, Sick, Annual)
  await prisma.leaveType.createMany({
    data: [
      { id: uuidv7(), name: 'Casual', daysPerYear: 12, hospitalId },
      { id: uuidv7(), name: 'Sick', daysPerYear: 10, hospitalId },
      { id: uuidv7(), name: 'Annual', daysPerYear: 24, hospitalId },
    ],
    skipDuplicates: true,
  });

  // 2️⃣ Staff Users (demo staff members)
  await prisma.user.createMany({
    data: [
      {
        id: uuidv7(),
        email: 'alice@example.com',
        password: await hashPassword('Secret123'),
        role: 'STAFF',
        firstName: 'Alice',
        lastName: 'Rahman',
        phone: '+8801712345678',
        hospitalId,
        createdBy: 'seed',
        updatedBy: 'seed',
      },
      {
        id: uuidv7(),
        email: 'bob@example.com',
        password: await hashPassword('Secret123'),
        role: 'STAFF',
        firstName: 'Bob',
        lastName: 'Khan',
        phone: '+8801911122233',
        hospitalId,
        createdBy: 'seed',
        updatedBy: 'seed',
      },
    ],
    skipDuplicates: true,
  });

  // 3️⃣ Generate leave balances for each staff member based on leave types
  const staff = await prisma.user.findMany({ where: { role: 'STAFF', hospitalId } });
  const types = await prisma.leaveType.findMany({ where: { hospitalId } });

  for (const s of staff) {
    for (const t of types) {
      await prisma.leaveBalance.create({
        data: {
          id: uuidv7(),
          employeeId: s.id,
          leaveTypeId: t.id,
          allocated: t.daysPerYear,
          used: 0,
          remaining: t.daysPerYear,
          hospitalId,
          createdBy: 'seed',
          updatedBy: 'seed',
        },
      });
    }
  }

  // 4️⃣ Sample attendance (clock‑in/out) for the past week
  const now = new Date();
  for (const s of staff) {
    for (let i = 0; i < 5; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const clockIn = new Date(day);
      clockIn.setHours(9, 0, 0, 0);
      const clockOut = new Date(day);
      clockOut.setHours(17, 30, 0, 0);

      await prisma.attendance.create({
        data: {
          id: uuidv7(),
          employeeId: s.id,
          clockIn: clockIn.toISOString(),
          clockOut: clockOut.toISOString(),
          hospitalId,
          createdBy: 'seed',
          updatedBy: 'seed',
        },
      });
    }
  }

  console.log('✅ Leave & Attendance demo data seeded');
}
