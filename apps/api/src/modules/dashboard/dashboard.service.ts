import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(hospitalId: string, role: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      paymentsToday,
      paymentsMonth,
      appointmentsToday,
      appointmentsCheckedIn,
      occupiedBeds,
      totalBeds,
      pendingLabs,
      pendingPrescriptions,
      totalPatients,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { hospitalId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { hospitalId, status: 'COMPLETED', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.appointment.count({
        where: { hospitalId, scheduledDate: { gte: start, lte: end } },
      }),
      this.prisma.appointment.count({
        where: { hospitalId, scheduledDate: { gte: start, lte: end }, status: 'CHECKED_IN' },
      }),
      this.prisma.bed.count({
        where: { hospitalId, status: 'OCCUPIED' },
      }),
      this.prisma.bed.count({
        where: { hospitalId },
      }),
      this.prisma.labOrder.count({
        where: { hospitalId, status: { notIn: ['APPROVED', 'CANCELLED'] } },
      }),
      this.prisma.prescription.count({
        where: { hospitalId, status: 'ACTIVE' },
      }),
      this.prisma.patient.count({
        where: { hospitalId, isActive: true },
      }),
    ]);

    // Memory filter for low stock to avoid complex raw DB comparisons
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { hospitalId, isActive: true },
      select: { totalQty: true, reorderLevel: true },
    });
    const lowStockCount = inventoryItems.filter((i) => i.totalQty <= i.reorderLevel).length;

    return {
      revenueToday: Number(paymentsToday._sum.amount || 0),
      revenueThisMonth: Number(paymentsMonth._sum.amount || 0),
      appointmentsTodayCount: appointmentsToday,
      appointmentsCheckedInCount: appointmentsCheckedIn,
      occupiedBedsCount: occupiedBeds,
      totalBedsCount: totalBeds,
      pendingLabOrdersCount: pendingLabs,
      pendingPrescriptionsCount: pendingPrescriptions,
      lowStockItemsCount: lowStockCount,
      activePatientsCount: totalPatients,
    };
  }

  async getRecentActivities(hospitalId: string, limit: number) {
    const take = limit || 10;
    return this.prisma.auditLog.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: true,
      },
    });
  }

  async getTodayAppointmentsSummary(hospitalId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: { hospitalId, scheduledDate: { gte: start, lte: end } },
      select: { status: true },
    });

    const summary = appointments.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(summary).map(([status, count]) => ({
      status,
      count,
    }));
  }

  async getBedOccupancySummary(hospitalId: string) {
    const wards = await this.prisma.ward.findMany({
      where: { hospitalId, isActive: true },
      include: {
        beds: {
          select: { status: true },
        },
      },
    });

    return wards.map((w) => {
      const total = w.beds.length;
      const occupied = w.beds.filter((b) => b.status === 'OCCUPIED').length;
      return {
        wardName: w.name,
        wardNameBn: w.nameBn || w.name,
        occupiedBeds: occupied,
        totalBeds: total,
      };
    });
  }

  async getPendingLabOrders(hospitalId: string, limit: number) {
    return this.prisma.labOrder.findMany({
      where: { hospitalId, status: { notIn: ['APPROVED', 'CANCELLED'] } },
      orderBy: { createdAt: 'asc' },
      take: limit || 10,
      include: {
        visit: {
          include: { patient: true },
        },
      },
    });
  }

  async getPendingPrescriptions(hospitalId: string, limit: number) {
    return this.prisma.prescription.findMany({
      where: { hospitalId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      take: limit || 10,
      include: {
        visit: {
          include: { patient: true },
        },
      },
    });
  }

  async getLowStockAlerts(hospitalId: string, limit: number) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { hospitalId, isActive: true },
      orderBy: { totalQty: 'asc' },
      include: { hospital: true },
    });

    const lowStock = items.filter((i) => i.totalQty <= i.reorderLevel);
    return lowStock.slice(0, limit || 10);
  }

  async getUpcomingFollowUps(hospitalId: string, limit: number) {
    const start = new Date();
    return this.prisma.followUpSchedule.findMany({
      where: { hospitalId, scheduledAt: { gte: start }, isDone: false },
      orderBy: { scheduledAt: 'asc' },
      take: limit || 10,
      include: {
        patient: true,
      },
    });
  }
}
