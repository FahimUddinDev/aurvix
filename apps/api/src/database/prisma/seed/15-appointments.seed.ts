import { PrismaClient, AppointmentStatus, AppointmentType } from '@prisma/client';

export async function seedAppointments(
  prisma: PrismaClient,
  hospital: { id: string },
  patients: any[],
  doctors: any[],
) {
  if (patients.length === 0 || doctors.length === 0) {
    throw new Error('Requires pre-seeded patients and doctors for appointment seeding.');
  }

  const seededAppointments = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Let's create a list of appointment dates (past, today, future)
  const relativeDates = [
    { label: 'past-3', date: new Date(new Date().setDate(now.getDate() - 3)) },
    { label: 'past-2', date: new Date(new Date().setDate(now.getDate() - 2)) },
    { label: 'past-1', date: new Date(new Date().setDate(now.getDate() - 1)) },
    { label: 'today', date: new Date() },
    { label: 'future-1', date: new Date(new Date().setDate(now.getDate() + 1)) },
    { label: 'future-2', date: new Date(new Date().setDate(now.getDate() + 2)) },
    { label: 'future-3', date: new Date(new Date().setDate(now.getDate() + 3)) },
  ];

  // Ensure stable timeslots
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

  let index = 0;
  for (const doc of doctors) {
    // Generate ~3 appointments per doctor to populate database
    for (let i = 0; i < 3; i++) {
      const patient = patients[index % patients.length];
      const relDate = relativeDates[(index + i) % relativeDates.length]!;
      const slotStartTime = timeSlots[(index + i) % timeSlots.length]!;

      // Add 30 minutes to generate slotEndTime
      const [h, m] = slotStartTime.split(':').map(Number);
      const endM = (m || 0) + 30;
      const slotEndTime = `${String(Math.floor((h || 0) + endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;

      const isToday = relDate.label === 'today';
      const isPast = relDate.label.startsWith('past');

      let status: AppointmentStatus = AppointmentStatus.BOOKED;
      let checkedInAt = null;
      let completedAt = null;

      if (isPast) {
        status = AppointmentStatus.COMPLETED;
        completedAt = new Date(relDate.date);
      } else if (isToday) {
        // Distribute statuses for today's queue test
        const r = i % 3;
        if (r === 0) {
          status = AppointmentStatus.BOOKED;
        } else if (r === 1) {
          status = AppointmentStatus.CHECKED_IN;
          checkedInAt = new Date();
        } else {
          status = AppointmentStatus.IN_PROGRESS;
          checkedInAt = new Date();
        }
      }

      const tokenNumberStr = String(i + 1).padStart(2, '0');

      const appointmentId = `00000000-0000-0000-0001-${String(index + 1).padStart(12, '0')}`;
      const appointment = await prisma.appointment.upsert({
        where: { id: appointmentId },
        update: {},
        create: {
          id: appointmentId,
          hospitalId: hospital.id,
          patientId: patient.id,
          doctorId: doc.id,
          departmentId: doc.departmentId,
          type: AppointmentType.SCHEDULED,
          status,
          scheduledDate: relDate.date,
          slotStartTime,
          slotEndTime,
          tokenNumber: tokenNumberStr,
          chiefComplaint: 'Routine medical consultation',
          checkedInAt,
          completedAt,
        },
      });

      // Seeding QueueToken
      await prisma.queueToken.upsert({
        where: { appointmentId: appointment.id },
        update: {},
        create: {
          hospitalId: hospital.id,
          appointmentId: appointment.id,
          tokenNumber: tokenNumberStr,
          displayLabel: `T-${tokenNumberStr}`,
          estimatedWait: (i + 1) * 15,
          calledAt: status === AppointmentStatus.IN_PROGRESS ? new Date() : null,
          completedAt,
        },
      });

      seededAppointments.push(appointment);
      index++;
    }
  }

  return seededAppointments;
}
