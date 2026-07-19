import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async searchMedicine(hospitalId: string, query: string) {
    return this.prisma.medicine.findMany({
      where: {
        hospitalId,
        OR: [
          { brandName: { contains: query, mode: 'insensitive' } },
          { genericName: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: 15,
    });
  }

  async checkDrugInteractions(medicineIds: string[]) {
    if (medicineIds.length < 2) return [];

    const interactions = await this.prisma.drugInteraction.findMany({
      where: {
        OR: [
          { drugAId: { in: medicineIds }, drugBId: { in: medicineIds } },
          { drugAId: { in: medicineIds }, drugBId: { in: medicineIds } },
        ],
      },
    });

    return interactions.map((i) => ({
      medicineAId: i.drugAId,
      medicineBId: i.drugBId,
      severity: i.severity,
      description: i.description,
    }));
  }

  async getHistory(hospitalId: string, patientId: string) {
    return this.prisma.prescription.findMany({
      where: { hospitalId, patientId },
      include: {
        items: {
          include: { medicine: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPrescription(hospitalId: string, input: any, createdBy: string) {
    const { visitId, items, notes, validUntil } = input;

    // Wrap in transaction for clinical integrity
    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
      });

      if (!visit) {
        throw new Error('Visit not found.');
      }

      // Create prescription
      const prescription = await tx.prescription.create({
        data: {
          hospitalId,
          visitId,
          patientId: visit.patientId,
          doctorId: visit.doctorId,
          status: PrescriptionStatus.ACTIVE,
          notes,
          validUntil: validUntil ? new Date(validUntil) : null,
          createdBy,
          updatedBy: createdBy,
        },
      });

      // Create prescription items
      for (const item of items) {
        await tx.prescriptionItem.create({
          data: {
            hospitalId,
            prescriptionId: prescription.id,
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route || 'ORAL',
            instructions: item.instructions,
            qty: item.qty || 1,
            createdBy,
            updatedBy: createdBy,
          },
        });
      }

      // Query complete prescription back
      const fullPrescription = await tx.prescription.findUnique({
        where: { id: prescription.id },
        include: {
          items: {
            include: { medicine: true },
          },
        },
      });

      // Emit event
      this.eventEmitter.emit('prescription.created', {
        prescriptionId: prescription.id,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        hospitalId,
      });

      return fullPrescription;
    });
  }

  async suspendPrescription(id: string, reason: string, updatedBy: string) {
    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.CANCELLED,
        notes: reason,
        updatedBy,
      },
      include: {
        items: {
          include: { medicine: true },
        },
      },
    });
  }
}
