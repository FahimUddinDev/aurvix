import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdmissionStatus, BedStatus } from '@prisma/client';

@Injectable()
export class AdmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getWards(hospitalId: string) {
    return this.prisma.ward.findMany({
      where: { hospitalId, isActive: true },
      include: { beds: true },
      orderBy: { name: 'asc' },
    });
  }

  async getBeds(hospitalId: string, wardId?: string, status?: string) {
    const where: any = { hospitalId };
    if (wardId) where.wardId = wardId;
    if (status) where.status = status as BedStatus;

    return this.prisma.bed.findMany({
      where,
      include: { ward: true },
      orderBy: { bedNumber: 'asc' },
    });
  }

  async getAdmissions(hospitalId: string, status?: string, search?: string) {
    const where: any = { hospitalId };
    if (status) {
      where.status = status as AdmissionStatus;
    }
    if (search) {
      where.patient = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { uhid: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.admission.findMany({
      where,
      include: { patient: true, bed: { include: { ward: true } } },
      orderBy: { admissionDate: 'desc' },
    });
  }

  async admitPatient(hospitalId: string, input: any, userId: string) {
    const { patientId, bedId, admissionNotes } = input;

    return this.prisma.$transaction(async (tx) => {
      // 1. Check if bed is available
      const bed = await tx.bed.findUnique({ where: { id: bedId } });
      if (!bed || bed.status !== BedStatus.AVAILABLE) {
        throw new Error('Selected bed is not available for occupancy.');
      }

      // 2. Check if patient is already admitted
      const existing = await tx.admission.findFirst({
        where: { hospitalId, patientId, status: AdmissionStatus.ACTIVE },
      });
      if (existing) {
        throw new Error('Patient is already currently admitted in inpatient care.');
      }

      // 3. Mark bed as occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.OCCUPIED, updatedBy: userId },
      });

      // 4. Create Admission log
      return tx.admission.create({
        data: {
          hospitalId,
          patientId,
          bedId,
          admittedBy: userId,
          status: AdmissionStatus.ACTIVE,
          admissionDate: new Date(),
          admissionNotes,
          createdBy: userId,
          updatedBy: userId,
        },
        include: { patient: true, bed: { include: { ward: true } } },
      });
    });
  }

  async transferPatient(admissionId: string, bedId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const adm = await tx.admission.findUnique({ where: { id: admissionId } });
      if (!adm || adm.status !== AdmissionStatus.ACTIVE) {
        throw new Error('Active inpatient admission file not found.');
      }

      const newBed = await tx.bed.findUnique({ where: { id: bedId } });
      if (!newBed || newBed.status !== BedStatus.AVAILABLE) {
        throw new Error('Selected transfer destination bed is not available.');
      }

      // Mark old bed for cleaning
      await tx.bed.update({
        where: { id: adm.bedId },
        data: { status: BedStatus.UNDER_CLEANING, updatedBy: userId },
      });

      // Mark new bed occupied
      await tx.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.OCCUPIED, updatedBy: userId },
      });

      // Update admission
      return tx.admission.update({
        where: { id: admissionId },
        data: { bedId, updatedBy: userId },
        include: { patient: true, bed: { include: { ward: true } } },
      });
    });
  }

  async dischargePatient(admissionId: string, notes: string | undefined, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const adm = await tx.admission.findUnique({
        where: { id: admissionId },
        include: { bed: { include: { ward: true } } },
      });
      if (!adm || adm.status !== AdmissionStatus.ACTIVE) {
        throw new Error('Active inpatient admission file not found.');
      }

      const dischargeDate = new Date();

      // Mark bed for cleaning
      await tx.bed.update({
        where: { id: adm.bedId },
        data: { status: BedStatus.UNDER_CLEANING, updatedBy: userId },
      });

      // Discharge admission
      const updatedAdm = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: AdmissionStatus.DISCHARGED,
          dischargeDate,
          admissionNotes: notes,
          updatedBy: userId,
        },
        include: { patient: true, bed: { include: { ward: true } } },
      });

      // Emit event
      this.eventEmitter.emit('admission.discharged', {
        admissionId: adm.id,
        patientId: adm.patientId,
        hospitalId: adm.hospitalId,
        wardId: adm.bed.wardId,
        admissionDate: adm.admissionDate,
        dischargeDate,
      });

      return updatedAdm;
    });
  }

  async markBedCleaned(bedId: string, userId: string) {
    return this.prisma.bed.update({
      where: { id: bedId },
      data: { status: BedStatus.AVAILABLE, updatedBy: userId },
      include: { ward: true },
    });
  }
}
