import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AttendanceType, LeaveStatus } from '@prisma/client';

@Injectable()
export class HrmService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendanceLogs(hospitalId: string, search?: string) {
    const where: any = { hospitalId };

    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.attendance.findMany({
      where,
      include: { employee: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLeaveBalances(hospitalId: string, userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!emp) return [];

    return this.prisma.leaveBalance.findMany({
      where: { hospitalId, employeeId: emp.id },
      include: { leaveType: true },
    });
  }

  async getLeaveRequests(hospitalId: string, userId: string, status?: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
    });

    const where: any = { hospitalId };
    if (status) {
      where.status = status as LeaveStatus;
    } else if (emp) {
      // If no status is queried, filter to the employee's own requests
      where.employeeId = emp.id;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerClockIn(hospitalId: string, userId: string, ipAddress?: string, method = 'MANUAL') {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new Error('Employee profile not found for this user account.');

    return this.prisma.attendance.create({
      data: {
        hospitalId,
        employeeId: emp.id,
        type: AttendanceType.CHECK_IN,
        timestamp: new Date(),
        method,
        ipAddress,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async registerClockOut(hospitalId: string, userId: string, ipAddress?: string, method = 'MANUAL') {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new Error('Employee profile not found for this user account.');

    return this.prisma.attendance.create({
      data: {
        hospitalId,
        employeeId: emp.id,
        type: AttendanceType.CHECK_OUT,
        timestamp: new Date(),
        method,
        ipAddress,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async submitLeave(
    hospitalId: string,
    userId: string,
    leaveTypeId: string,
    startDate: Date,
    endDate: Date,
    reason?: string,
  ) {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new Error('Employee profile not found.');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const year = start.getFullYear();

    // Check balance
    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: emp.id,
          leaveTypeId,
          year,
        },
      },
    });

    if (!balance || balance.remaining < days) {
      throw new Error(`Insufficient leave balance. Requested: ${days} days, Remaining: ${balance?.remaining || 0} days.`);
    }

    return this.prisma.leaveRequest.create({
      data: {
        hospitalId,
        employeeId: emp.id,
        leaveTypeId,
        startDate: start,
        endDate: end,
        days,
        reason,
        status: LeaveStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { employee: true, leaveType: true },
    });
  }

  async reviewLeave(id: string, approve: boolean, rejectionNote: string | undefined, managerUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id },
      });
      if (!request || request.status !== LeaveStatus.PENDING) {
        throw new Error('Pending leave request not found or already reviewed.');
      }

      if (approve) {
        const start = new Date(request.startDate);
        const year = start.getFullYear();

        // 1. Deduct leave balance
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              year,
            },
          },
        });

        if (!balance || balance.remaining < request.days) {
          throw new Error('Insufficient leave balance remaining.');
        }

        const newUsed = balance.used + request.days;
        const newRemaining = balance.allocated - newUsed;

        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: newUsed,
            remaining: newRemaining,
            updatedBy: managerUserId,
          },
        });

        // 2. Set request status to APPROVED
        return tx.leaveRequest.update({
          where: { id },
          data: {
            status: LeaveStatus.APPROVED,
            approvedBy: managerUserId,
            updatedBy: managerUserId,
          },
          include: { employee: true, leaveType: true },
        });
      } else {
        // Reject request
        return tx.leaveRequest.update({
          where: { id },
          data: {
            status: LeaveStatus.REJECTED,
            rejectionNote,
            updatedBy: managerUserId,
          },
          include: { employee: true, leaveType: true },
        });
      }
    });
  }
}
