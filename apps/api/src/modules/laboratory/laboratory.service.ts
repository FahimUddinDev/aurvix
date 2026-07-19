import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LabOrderStatus, ResultFlag } from '@prisma/client';

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getWorklist(hospitalId: string, status?: string, priority?: string) {
    const where: any = { hospitalId };
    if (status) {
      where.status = status as LabOrderStatus;
    }
    if (priority) {
      where.priority = priority;
    }

    return this.prisma.labOrder.findMany({
      where,
      include: {
        items: { include: { test: true } },
        samples: true,
        results: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        items: { include: { test: true } },
        samples: true,
        results: true,
      },
    });

    if (!order) {
      throw new Error(`Laboratory order with ID ${id} not found.`);
    }

    return order;
  }

  async getCatalog(hospitalId: string, category?: string, search?: string) {
    const where: any = { hospitalId, isActive: true };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.labTest.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getPatientHistory(hospitalId: string, patientId: string) {
    return this.prisma.labOrder.findMany({
      where: { hospitalId, patientId, status: LabOrderStatus.APPROVED },
      include: {
        items: { include: { test: true } },
        results: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async collectSample(hospitalId: string, orderId: string, input: any, collectedBy: string) {
    const { sampleType, barcode } = input;

    return this.prisma.$transaction(async (tx) => {
      // Create sample
      const sample = await tx.labSample.create({
        data: {
          hospitalId,
          orderId,
          barcode,
          sampleType,
          collectedAt: new Date(),
          collectedBy,
          createdBy: collectedBy,
          updatedBy: collectedBy,
        },
      });

      // Update Order Status
      await tx.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.SAMPLE_COLLECTED,
          updatedBy: collectedBy,
        },
      });

      this.eventEmitter.emit('sample.collected', { orderId, sampleId: sample.id, barcode });

      return sample;
    });
  }

  async enterResults(hospitalId: string, orderId: string, resultsInput: any[], enteredBy: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new Error('Lab order not found.');

    const patient = await this.prisma.patient.findUnique({
      where: { id: order.patientId },
    });
    if (!patient) throw new Error('Patient not found.');

    const gender = patient.gender;
    const resultsOut: any[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const res of resultsInput) {
        const test = await tx.labTest.findUnique({
          where: { id: res.testId },
        });
        if (!test) throw new Error(`Lab test with ID ${res.testId} not found.`);

        // Analyze and flag result
        const flag = this.calculateFlag(res.value, test, gender);

        // Delete existing result if re-running
        await tx.labResult.deleteMany({
          where: { orderId, testId: res.testId },
        });

        const normalRangeStr = gender === 'FEMALE' ? test.normalRangeFemale : test.normalRangeMale;

        const labResult = await tx.labResult.create({
          data: {
            hospitalId,
            orderId,
            testId: res.testId,
            value: res.value,
            unit: test.unit || '',
            flag,
            normalRange: normalRangeStr || '',
            remarks: res.remarks,
            enteredBy,
            createdBy: enteredBy,
            updatedBy: enteredBy,
          },
        });

        resultsOut.push(labResult);

        // If Critical, flag automatically
        if (flag === ResultFlag.CRITICAL_HIGH || flag === ResultFlag.CRITICAL_LOW) {
          this.eventEmitter.emit('results.critical', {
            orderId,
            patientId: order.patientId,
            testId: res.testId,
            value: res.value,
            flag,
          });
        }
      }

      // Set order status to resulted
      await tx.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.RESULTED,
          updatedBy: enteredBy,
        },
      });
    });

    return resultsOut;
  }

  async approveResults(orderId: string, approvedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update all results to approved
      await tx.labResult.updateMany({
        where: { orderId },
        data: {
          approvedBy,
          approvedAt: new Date(),
          updatedBy: approvedBy,
        },
      });

      // 2. Set order status to APPROVED
      const order = await tx.labOrder.update({
        where: { id: orderId },
        data: {
          status: LabOrderStatus.APPROVED,
          updatedBy: approvedBy,
        },
      });

      this.eventEmitter.emit('results.approved', { orderId });

      return order;
    });
  }

  async rejectResults(orderId: string, reason: string, rejectedBy: string) {
    const order = await this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status: LabOrderStatus.REJECTED,
        notes: reason,
        updatedBy: rejectedBy,
      },
    });

    this.eventEmitter.emit('results.rejected', { orderId, reason });

    return order;
  }

  async flagCritical(orderId: string, updatedBy: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new Error('Order not found.');

    this.eventEmitter.emit('results.critical', {
      orderId,
      patientId: order.patientId,
      notes: 'Manually flagged as critical.',
    });

    return order;
  }

  private calculateFlag(valueStr: string, test: any, gender: string): ResultFlag {
    const rangeStr = gender === 'FEMALE' ? test.normalRangeFemale : test.normalRangeMale;
    if (!rangeStr) return ResultFlag.NORMAL;

    const val = parseFloat(valueStr);
    if (isNaN(val)) return ResultFlag.NORMAL;

    // Matches standard formats: "12.0 - 16.0" or "70-110"
    const match = rangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (match) {
      const min = parseFloat(match[1]!);
      const max = parseFloat(match[2]!);
      if (val < min) {
        if (val < min * 0.7) return ResultFlag.CRITICAL_LOW;
        return ResultFlag.ABNORMAL;
      }
      if (val > max) {
        if (val > max * 1.3) return ResultFlag.CRITICAL_HIGH;
        return ResultFlag.ABNORMAL;
      }
    }
    return ResultFlag.NORMAL;
  }
}
