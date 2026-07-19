import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAvailableSlots(doctorId: string, date: string): Promise<any[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELLED'] },
      },
      select: { slotStartTime: true },
    });

    const bookedSlots = new Set(appointments.map((a) => a.slotStartTime).filter(Boolean));
    const slots: any[] = [];

    for (const sched of schedules) {
      const [startHour, startMin] = sched.startTime.split(':').map(Number);
      const [endHour, endMin] = sched.endTime.split(':').map(Number);

      const startTotal = (startHour || 0) * 60 + (startMin || 0);
      const endTotal = (endHour || 0) * 60 + (endMin || 0);

      let currentTotal = startTotal;
      while (currentTotal + sched.slotDurationMin <= endTotal) {
        const h = Math.floor(currentTotal / 60);
        const m = currentTotal % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const isBooked = bookedSlots.has(timeStr);
        slots.push({
          startTime: timeStr,
          endTime: this.addMinutesToTimeStr(timeStr, sched.slotDurationMin),
          isAvailable: !isBooked,
        });

        currentTotal += sched.slotDurationMin;
      }
    }

    return slots;
  }

  async getAvailableDoctors(hospitalId: string, departmentId: string, date: string): Promise<any[]> {
    const doctors = await this.prisma.doctorProfile.findMany({
      where: { hospitalId, departmentId, isActive: true },
      include: { user: true },
    });

    const doctorsWithSlots = [];
    for (const doc of doctors) {
      const slots = await this.getAvailableSlots(doc.id, date);
      doctorsWithSlots.push({
        id: doc.id,
        name: `Dr. ${doc.user.firstName} ${doc.user.lastName}`,
        specialization: doc.specialization,
        slots,
      });
    }

    return doctorsWithSlots;
  }

  async listAppointments(hospitalId: string, filters: any, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId };

    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: true,
          doctor: {
            include: { user: true, department: true },
          },
          queueToken: true,
        },
        orderBy: { scheduledDate: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findAppointmentById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          include: { user: true, department: true },
        },
        queueToken: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment with ID ${id} not found.`);
    }

    return appointment;
  }

  async getTodayQueue(hospitalId: string, doctorId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        hospitalId,
        doctorId,
        scheduledDate: { gte: start, lte: end },
        status: { in: ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
      include: {
        patient: true,
        queueToken: true,
      },
      orderBy: { tokenNumber: 'asc' },
    });
  }

  async createAppointment(hospitalId: string, input: any, createdBy: string) {
    const { patientId, doctorId, departmentId, scheduledDate, slotStartTime, slotEndTime, chiefComplaint, type } = input;

    // Wrap in transaction for safety
    return this.prisma.$transaction(async (tx) => {
      const targetDate = new Date(scheduledDate);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check slot double-booking
      if (slotStartTime) {
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId,
            scheduledDate: { gte: startOfDay, lte: endOfDay },
            slotStartTime,
            status: { notIn: ['CANCELLED'] },
          },
        });
        if (existing) {
          throw new Error('This slot is already booked.');
        }
      }

      // Generate sequence token
      const count = await tx.appointment.count({
        where: {
          doctorId,
          scheduledDate: { gte: startOfDay, lte: endOfDay },
        },
      });

      const nextTokenNum = count + 1;
      const tokenNumberStr = String(nextTokenNum).padStart(2, '0');

      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          hospitalId,
          patientId,
          doctorId,
          departmentId,
          type: type || 'SCHEDULED',
          status: 'BOOKED',
          scheduledDate: targetDate,
          slotStartTime,
          slotEndTime,
          tokenNumber: tokenNumberStr,
          chiefComplaint,
          createdBy,
          updatedBy: createdBy,
        },
        include: {
          patient: true,
          doctor: { include: { user: true, department: true } },
        },
      });

      // Create QueueToken
      const estimatedWait = nextTokenNum * 15; // 15 mins average
      const queueToken = await tx.queueToken.create({
        data: {
          hospitalId,
          appointmentId: appointment.id,
          tokenNumber: tokenNumberStr,
          displayLabel: `T-${tokenNumberStr}`,
          estimatedWait,
          createdBy,
          updatedBy: createdBy,
        },
      });

      // Emit event
      this.eventEmitter.emit('appointment.booked', { appointmentId: appointment.id });

      return {
        ...appointment,
        queueToken,
      };
    });
  }

  async rescheduleAppointment(input: any, updatedBy: string) {
    const { appointmentId, scheduledDate, slotStartTime } = input;

    const current = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!current) throw new Error('Appointment not found.');

    const targetDate = new Date(scheduledDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (slotStartTime && slotStartTime !== current.slotStartTime) {
      const existing = await this.prisma.appointment.findFirst({
        where: {
          doctorId: current.doctorId,
          scheduledDate: { gte: startOfDay, lte: endOfDay },
          slotStartTime,
          status: { notIn: ['CANCELLED'] },
        },
      });
      if (existing) {
        throw new Error('This slot is already booked.');
      }
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledDate: targetDate,
        slotStartTime,
        status: 'BOOKED',
        updatedBy,
      },
      include: {
        patient: true,
        queueToken: true,
      },
    });
  }

  async cancelAppointment(input: any, updatedBy: string) {
    const { appointmentId, reason } = input;

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        updatedBy,
      },
      include: {
        patient: true,
        queueToken: true,
      },
    });
  }

  async checkInPatient(appointmentId: string, updatedBy: string) {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        updatedBy,
      },
      include: {
        patient: true,
        queueToken: true,
      },
    });

    await this.emitQueueDisplayUpdate(appointment.hospitalId, appointment.departmentId);

    return appointment;
  }

  async callNextPatient(hospitalId: string, doctorId: string, updatedBy: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get next checked in appointment
    const nextApp = await this.prisma.appointment.findFirst({
      where: {
        hospitalId,
        doctorId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: 'CHECKED_IN',
      },
      orderBy: { tokenNumber: 'asc' },
      include: { queueToken: true },
    });

    if (!nextApp) {
      throw new Error('No checked-in patients in the queue.');
    }

    // Wrap state update
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark currently active in_progress as completed if any
      await tx.appointment.updateMany({
        where: {
          doctorId,
          status: 'IN_PROGRESS',
          scheduledDate: { gte: startOfDay, lte: endOfDay },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedBy,
        },
      });

      // 2. Set next one to IN_PROGRESS
      const activeApp = await tx.appointment.update({
        where: { id: nextApp.id },
        data: {
          status: 'IN_PROGRESS',
          updatedBy,
        },
        include: {
          patient: true,
          queueToken: true,
        },
      });

      if (activeApp.queueToken) {
        await tx.queueToken.update({
          where: { id: activeApp.queueToken.id },
          data: {
            calledAt: new Date(),
            updatedBy,
          },
        });
      }

      const refreshed = await tx.appointment.findUnique({
        where: { id: nextApp.id },
        include: {
          patient: true,
          queueToken: true,
        },
      });

      await this.emitQueueDisplayUpdate(hospitalId, refreshed!.departmentId);
      
      // Emit status update for websocket
      this.eventEmitter.emit('queue.status', {
        doctorId,
        queueToken: refreshed!.queueToken,
      });

      return refreshed;
    });
  }

  async skipPatient(appointmentId: string, reason: string, updatedBy: string) {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'NO_SHOW',
        cancelReason: reason,
        updatedBy,
      },
      include: {
        patient: true,
        queueToken: true,
      },
    });

    await this.emitQueueDisplayUpdate(appointment.hospitalId, appointment.departmentId);

    return appointment;
  }

  private addMinutesToTimeStr(timeStr: string, minutes: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const total = (h || 0) * 60 + (m || 0) + minutes;
    const finalH = Math.floor(total / 60) % 24;
    const finalM = total % 60;
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
  }

  async emitQueueDisplayUpdate(hospitalId: string, departmentId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // IN_PROGRESS appointments (Current)
    const activeAppointments = await this.prisma.appointment.findMany({
      where: {
        hospitalId,
        departmentId,
        status: 'IN_PROGRESS',
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      include: { queueToken: true },
    });
    const activeTokens = activeAppointments.map((a) => a.queueToken).filter(Boolean);

    // CHECKED_IN appointments (Up Next)
    const nextAppointments = await this.prisma.appointment.findMany({
      where: {
        hospitalId,
        departmentId,
        status: 'CHECKED_IN',
        scheduledDate: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { tokenNumber: 'asc' },
      take: 5,
      include: { queueToken: true },
    });
    const nextTokens = nextAppointments.map((a) => a.queueToken).filter(Boolean);

    this.eventEmitter.emit('queue.display', {
      departmentId,
      displayData: {
        departmentId,
        activeTokens,
        nextTokens,
      },
    });
  }
}
