import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PatientService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'NID_ENCRYPTION_KEY',
      'aurevix-nid-default-secret-key-32chars',
    );
  }

  private encryptNid(nid: string): string {
    if (!nid) return nid;
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const iv = crypto.createHash('sha256').update(nid).digest().slice(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(nid, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted + ':' + iv.toString('hex');
  }

  private decryptNid(encryptedWithIv: string): string {
    if (!encryptedWithIv) return encryptedWithIv;
    const parts = encryptedWithIv.split(':');
    if (parts.length !== 2) return encryptedWithIv;
    const [encrypted, ivHex] = parts as [string, string];
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const iv = Buffer.from(ivHex, 'hex');
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8') as string;
      decrypted += decipher.final('utf8') as string;
      return decrypted;
    } catch {
      return encryptedWithIv; // fallback on decipher fail
    }
  }

  async listPatients(hospitalId: string, search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { hospitalId, isActive: true };

    if (search) {
      const trimmed = search.trim();
      if (trimmed.startsWith('+880') || trimmed.match(/^\d{11}$/)) {
        where.phone = { contains: trimmed };
      } else if (trimmed.includes('-')) {
        where.uhid = { contains: trimmed, mode: 'insensitive' };
      } else if (trimmed.match(/^\d{10,17}$/)) {
        where.nidEncrypted = { startsWith: this.encryptNid(trimmed).split(':')[0] };
      } else {
        where.OR = [
          { firstName: { contains: trimmed, mode: 'insensitive' } },
          { lastName: { contains: trimmed, mode: 'insensitive' } },
          { firstNameBn: { contains: trimmed, mode: 'insensitive' } },
          { lastNameBn: { contains: trimmed, mode: 'insensitive' } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        ...p,
        nidDecrypted: p.nidEncrypted ? this.decryptNid(p.nidEncrypted) : null,
      })),
      total,
      page,
      limit,
    };
  }

  async findPatientById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        allergies: true,
        emergencyContacts: true,
        documents: true,
      },
    });

    if (!patient) throw new NotFoundException('Patient not found');

    return {
      ...patient,
      nidDecrypted: patient.nidEncrypted ? this.decryptNid(patient.nidEncrypted) : null,
    };
  }

  async createPatient(
    hospitalId: string,
    data: {
      firstName: string;
      lastName: string;
      firstNameBn?: string;
      lastNameBn?: string;
      dateOfBirth: Date;
      gender: any;
      bloodGroup?: any;
      phone: string;
      email?: string;
      address?: string;
      addressBn?: string;
      nid?: string;
      emergencyContacts?: Array<{ name: string; relationship: string; phone: string }>;
      allergies?: Array<{ allergen: string; reaction?: string; severity: string }>;
    },
    userId: string,
  ) {
    // Generate UHID
    const hospital = await this.prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new NotFoundException('Hospital not found');

    const prefix = hospital.uhidPrefix || 'HN';
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latestPatient = await this.prisma.patient.findFirst({
      where: {
        hospitalId,
        uhid: {
          startsWith: `${prefix}-${todayStr}-`,
        },
      },
      orderBy: { uhid: 'desc' },
      select: { uhid: true },
    });

    let seq = 1;
    if (latestPatient) {
      const parts = latestPatient.uhid.split('-');
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const lastSeq = parseInt(lastPart, 10);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }
    }
    const sequenceStr = String(seq).padStart(4, '0');
    const uhid = `${prefix}-${todayStr}-${sequenceStr}`;

    const nidEncrypted = data.nid ? this.encryptNid(data.nid) : undefined;

    return this.prisma.$transaction(async (tx) => {
      return tx.patient.create({
        data: {
          hospitalId,
          uhid,
          firstName: data.firstName,
          lastName: data.lastName,
          firstNameBn: data.firstNameBn,
          lastNameBn: data.lastNameBn,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
          phone: data.phone,
          email: data.email,
          address: data.address,
          addressBn: data.addressBn,
          nidEncrypted,
          createdBy: userId,
          updatedBy: userId,
          allergies: data.allergies
            ? {
                createMany: {
                  data: data.allergies.map((a) => ({
                    hospitalId,
                    allergen: a.allergen,
                    reaction: a.reaction,
                    severity: a.severity,
                    createdBy: userId,
                    updatedBy: userId,
                  })),
                },
              }
            : undefined,
          emergencyContacts: data.emergencyContacts
            ? {
                createMany: {
                  data: data.emergencyContacts.map((c) => ({
                    hospitalId,
                    name: c.name,
                    relationship: c.relationship,
                    phone: c.phone,
                    createdBy: userId,
                    updatedBy: userId,
                  })),
                },
              }
            : undefined,
        },
        include: {
          allergies: true,
          emergencyContacts: true,
        },
      });
    });
  }

  async updatePatient(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      firstNameBn?: string;
      lastNameBn?: string;
      dateOfBirth?: Date;
      gender?: any;
      bloodGroup?: any;
      phone?: string;
      email?: string;
      address?: string;
      addressBn?: string;
      nid?: string;
      emergencyContacts?: Array<{ name: string; relationship: string; phone: string }>;
      allergies?: Array<{ allergen: string; reaction?: string; severity: string }>;
    },
    userId: string,
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');

    const nidEncrypted = data.nid ? this.encryptNid(data.nid) : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Sync allergies if provided
      if (data.allergies) {
        await tx.patientAllergy.deleteMany({ where: { patientId: id } });
        await tx.patientAllergy.createMany({
          data: data.allergies.map((a) => ({
            hospitalId: patient.hospitalId,
            patientId: id,
            allergen: a.allergen,
            reaction: a.reaction,
            severity: a.severity,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      // Sync emergency contacts if provided
      if (data.emergencyContacts) {
        await tx.emergencyContact.deleteMany({ where: { patientId: id } });
        await tx.emergencyContact.createMany({
          data: data.emergencyContacts.map((c) => ({
            hospitalId: patient.hospitalId,
            patientId: id,
            name: c.name,
            relationship: c.relationship,
            phone: c.phone,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      const updatePayload: any = {
        ...data,
        nidEncrypted,
        updatedBy: userId,
      };
      delete updatePayload.allergies;
      delete updatePayload.emergencyContacts;
      delete updatePayload.nid;

      return tx.patient.update({
        where: { id },
        data: updatePayload,
        include: {
          allergies: true,
          emergencyContacts: true,
        },
      });
    });
  }

  async mergePatients(sourceId: string, targetId: string, userId: string): Promise<boolean> {
    if (sourceId === targetId)
      throw new BadRequestException('Cannot merge patient into themselves');

    const [source, target] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: sourceId } }),
      this.prisma.patient.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) throw new NotFoundException('Source or target patient not found');

    await this.prisma.$transaction(async (tx) => {
      // Update relations to point to targetId
      await tx.appointment.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.visit.updateMany({ where: { patientId: sourceId }, data: { patientId: targetId } });
      await tx.bill.updateMany({ where: { patientId: sourceId }, data: { patientId: targetId } });
      await tx.admission.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.patientAllergy.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.patientConsent.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.patientDocument.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.patientFeedback.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.followUpSchedule.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });
      await tx.emergencyContact.updateMany({
        where: { patientId: sourceId },
        data: { patientId: targetId },
      });

      // Deactivate and soft-delete source patient
      await tx.patient.update({
        where: { id: sourceId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          updatedBy: userId,
        },
      });
    });

    return true;
  }

  async getPatientTimeline(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');

    const [visits, bills, labOrders] = await Promise.all([
      this.prisma.visit.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bill.findMany({
        where: { patientId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.labOrder.findMany({
        where: { visit: { patientId: id } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const doctorIds = visits.map((v) => v.doctorId);
    const doctors = await this.prisma.doctorProfile.findMany({
      where: { id: { in: doctorIds } },
      include: { user: true },
    });
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    const timeline: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      date: Date;
    }> = [];

    visits.forEach((v) => {
      const doc = doctorMap.get(v.doctorId);
      const docName = doc ? `Dr. ${doc.user.firstName} ${doc.user.lastName}` : 'Medical Staff';
      timeline.push({
        id: v.id,
        type: 'VISIT',
        title: 'Clinical Visit',
        description: `Consultation with ${docName}${v.chiefComplaint ? ` - ${v.chiefComplaint}` : ''}`,
        date: v.createdAt,
      });
    });

    bills.forEach((b) => {
      timeline.push({
        id: b.id,
        type: 'BILL',
        title: `Bill Generated - ${b.billNo}`,
        description: `Total Amount: BDT ${b.totalAmount.toString()} (Status: ${b.status})`,
        date: b.createdAt,
      });
    });

    labOrders.forEach((l) => {
      timeline.push({
        id: l.id,
        type: 'LAB_ORDER',
        title: `Lab Investigation Ordered`,
        description: `Order Priority: ${l.priority} (Status: ${l.status})`,
        date: l.createdAt,
      });
    });

    // Sort combined timeline chronologically descending
    return timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}
