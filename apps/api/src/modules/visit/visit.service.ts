import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VisitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPatientEMR(hospitalId: string, patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error(`Patient with ID ${patientId} not found.`);
    }

    const visits = await this.prisma.visit.findMany({
      where: { hospitalId, patientId, isCompleted: true },
      include: {
        vitals: true,
        diagnoses: true,
        notes: true,
        prescriptions: {
          include: {
            items: {
              include: { medicine: true },
            },
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    return {
      patient,
      visits,
    };
  }

  async searchICD10Codes(query: string) {
    return this.prisma.iCD10Code.findMany({
      where: {
        OR: [
          { code: { startsWith: query.toUpperCase() } },
          { description: { contains: query, mode: 'insensitive' } },
          { descriptionBn: { contains: query } },
        ],
        isActive: true,
      },
      take: 15,
    });
  }

  async getVisitHistory(hospitalId: string, patientId: string) {
    return this.prisma.visit.findMany({
      where: { hospitalId, patientId },
      include: {
        vitals: true,
        diagnoses: true,
        notes: true,
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async startConsultation(hospitalId: string, appointmentId: string, createdBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const app = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!app) {
        throw new Error('Appointment not found.');
      }

      // Check if visit already exists
      const existing = await tx.visit.findUnique({
        where: { appointmentId },
      });
      if (existing) {
        return existing;
      }

      // 1. Create Visit
      const visit = await tx.visit.create({
        data: {
          hospitalId,
          patientId: app.patientId,
          appointmentId: app.id,
          doctorId: app.doctorId,
          departmentId: app.departmentId,
          chiefComplaint: app.chiefComplaint,
          isCompleted: false,
          createdBy,
          updatedBy: createdBy,
        },
      });

      // 2. Update Appointment to IN_PROGRESS
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'IN_PROGRESS',
          updatedBy: createdBy,
        },
      });

      return visit;
    });
  }

  async addVitals(hospitalId: string, visitId: string, input: any, createdBy: string) {
    return this.prisma.vitalSign.create({
      data: {
        hospitalId,
        visitId,
        systolicBp: input.systolicBp,
        diastolicBp: input.diastolicBp,
        heartRate: input.heartRate,
        temperature: input.temperature,
        spo2: input.spo2,
        respiratoryRate: input.respiratoryRate,
        weightKg: input.weightKg,
        heightCm: input.heightCm,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async addDiagnosis(hospitalId: string, visitId: string, input: any, createdBy: string) {
    return this.prisma.diagnosis.create({
      data: {
        hospitalId,
        visitId,
        icd10Code: input.icd10Code,
        icd10Desc: input.icd10Desc,
        description: input.description,
        isPrimary: input.isPrimary,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async addClinicalNote(hospitalId: string, visitId: string, input: any, createdBy: string) {
    return this.prisma.clinicalNote.create({
      data: {
        hospitalId,
        visitId,
        noteType: input.noteType,
        content: input.content,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  async completeConsultation(visitId: string, updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({
        where: { id: visitId },
      });
      if (!visit) {
        throw new Error('Visit not found.');
      }

      // Update visit completed
      const updatedVisit = await tx.visit.update({
        where: { id: visitId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          updatedBy,
        },
      });

      // Update related appointment if exists
      if (visit.appointmentId) {
        await tx.appointment.update({
          where: { id: visit.appointmentId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedBy,
          },
        });
      }

      // Emit completed event (for billing routing, SMS triggers, pharmacy worklists, etc.)
      this.eventEmitter.emit('consultation.completed', {
        visitId,
        patientId: visit.patientId,
        doctorId: visit.doctorId,
        hospitalId: visit.hospitalId,
      });

      return updatedVisit;
    });
  }
}
