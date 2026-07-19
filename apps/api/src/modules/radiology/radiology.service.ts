import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RadiologyOrderStatus } from '@prisma/client';

@Injectable()
export class RadiologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getWorklist(hospitalId: string, status?: string) {
    const where: any = { hospitalId };
    if (status) {
      where.status = status as RadiologyOrderStatus;
    }

    return this.prisma.radiologyOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.radiologyOrder.findUnique({
      where: { id },
    });
    if (!order) {
      throw new Error(`Radiology order with ID ${id} not found.`);
    }
    return order;
  }

  async getModalities(hospitalId: string) {
    return this.prisma.radiologyModality.findMany({
      where: { hospitalId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPatientHistory(hospitalId: string, patientId: string) {
    return this.prisma.radiologyOrder.findMany({
      where: { hospitalId, patientId, status: RadiologyOrderStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(hospitalId: string, visitId: string, input: any, createdBy: string) {
    const { patientId, doctorId, modalityId, clinicalInfo } = input;

    const order = await this.prisma.radiologyOrder.create({
      data: {
        hospitalId,
        visitId,
        patientId,
        doctorId,
        modalityId,
        clinicalInfo,
        status: RadiologyOrderStatus.PENDING,
        createdBy,
        updatedBy: createdBy,
      },
    });

    this.eventEmitter.emit('radiology.ordered', { orderId: order.id, visitId });

    return order;
  }

  async uploadReport(hospitalId: string, orderId: string, input: any, uploadedBy: string) {
    const { findings, impression, reportUrl } = input;

    return this.prisma.$transaction(async (tx) => {
      // Delete existing report if uploading a correction
      await tx.radiologyReport.deleteMany({
        where: { orderId },
      });

      const report = await tx.radiologyReport.create({
        data: {
          hospitalId,
          orderId,
          findings,
          impression,
          reportUrl,
          uploadedBy,
          createdBy: uploadedBy,
          updatedBy: uploadedBy,
        },
      });

      await tx.radiologyOrder.update({
        where: { id: orderId },
        data: {
          status: RadiologyOrderStatus.REPORT_UPLOADED,
          updatedBy: uploadedBy,
        },
      });

      this.eventEmitter.emit('radiology.report_uploaded', { orderId, reportId: report.id });

      return report;
    });
  }

  async approveReport(orderId: string, approvedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.radiologyReport.updateMany({
        where: { orderId },
        data: {
          approvedBy,
          approvedAt: new Date(),
          updatedBy: approvedBy,
        },
      });

      const order = await tx.radiologyOrder.update({
        where: { id: orderId },
        data: {
          status: RadiologyOrderStatus.APPROVED,
          updatedBy: approvedBy,
        },
      });

      this.eventEmitter.emit('radiology.approved', { orderId });

      return order;
    });
  }
}
