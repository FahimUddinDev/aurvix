import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private readonly prisma: PrismaService) {}

  async listDoctors(hospitalId: string, filters: any, page: number, limit: number) {
    const search = filters?.search;
    const departmentId = filters?.departmentId;
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      isActive: true,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { specialization: { contains: search, mode: 'insensitive' } },
        { qualification: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          department: true,
          schedules: true,
          fees: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        consultationFee: Number(item.consultationFee),
        fees: item.fees?.map((f) => ({ ...f, amount: Number(f.amount) })) || [],
      })),
      total,
      page,
      limit,
    };
  }

  async findDoctorById(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        schedules: true,
        fees: true,
      },
    });

    if (!doctor) {
      throw new Error(`Doctor with ID ${id} not found.`);
    }

    return {
      ...doctor,
      consultationFee: Number(doctor.consultationFee),
      fees: doctor.fees?.map((f) => ({ ...f, amount: Number(f.amount) })) || [],
    };
  }

  async getDoctorSchedule(doctorId: string) {
    return this.prisma.doctorSchedule.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async getDoctorFees(doctorId: string) {
    const fees = await this.prisma.doctorFee.findMany({
      where: { doctorId, isActive: true },
    });
    return fees.map((f) => ({
      ...f,
      amount: Number(f.amount),
    }));
  }

  async checkAvailability(doctorId: string, date: string): Promise<boolean> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: { doctorId, dayOfWeek, isActive: true },
    });

    if (!schedule) {
      return false;
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsCount = await this.prisma.appointment.count({
      where: {
        doctorId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { notIn: ['CANCELLED'] },
      },
    });

    return appointmentsCount < schedule.maxPatients;
  }

  async createDoctor(hospitalId: string, input: any, createdBy: string) {
    const { userId, departmentId, schedules, ...rest } = input;

    // Wrapped in Prisma transaction as per rule #4
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.doctorProfile.findUnique({
        where: { userId },
      });
      if (existing) {
        throw new Error('User already has a doctor profile.');
      }

      const doctor = await tx.doctorProfile.create({
        data: {
          hospitalId,
          userId,
          departmentId,
          createdBy,
          updatedBy: createdBy,
          ...rest,
          schedules: schedules
            ? {
                create: schedules.map((s: any) => ({
                  hospitalId,
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  slotDurationMin: s.slotDurationMin,
                  maxPatients: s.maxPatients,
                  createdBy,
                  updatedBy: createdBy,
                })),
              }
            : undefined,
        },
        include: {
          user: true,
          department: true,
          schedules: true,
          fees: true,
        },
      });

      return {
        ...doctor,
        consultationFee: Number(doctor.consultationFee),
        fees: doctor.fees?.map((f) => ({ ...f, amount: Number(f.amount) })) || [],
      };
    });
  }

  async updateDoctor(id: string, input: any, updatedBy: string) {
    const { consultationFee, ...rest } = input;
    const updated = await this.prisma.doctorProfile.update({
      where: { id },
      data: {
        ...rest,
        consultationFee: consultationFee !== undefined ? consultationFee : undefined,
        updatedBy,
      },
      include: {
        user: true,
        department: true,
        schedules: true,
        fees: true,
      },
    });

    return {
      ...updated,
      consultationFee: Number(updated.consultationFee),
      fees: updated.fees?.map((f) => ({ ...f, amount: Number(f.amount) })) || [],
    };
  }

  async updateSchedule(doctorId: string, slots: any[], hospitalId: string, updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.doctorSchedule.deleteMany({
        where: { doctorId },
      });

      if (slots && slots.length > 0) {
        await tx.doctorSchedule.createMany({
          data: slots.map((s) => ({
            hospitalId,
            doctorId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDurationMin: s.slotDurationMin,
            maxPatients: s.maxPatients,
            createdBy: updatedBy,
            updatedBy,
          })),
        });
      }

      return tx.doctorSchedule.findMany({
        where: { doctorId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }
}
