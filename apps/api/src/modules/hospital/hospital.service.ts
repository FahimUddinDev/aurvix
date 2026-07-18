import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class HospitalService {
  constructor(private readonly prisma: PrismaService) {}

  async findHospitalById(id: string) {
    return this.prisma.hospital.findUnique({
      where: { id },
      include: { branches: true, departments: true },
    });
  }

  async updateHospital(
    id: string,
    data: {
      name?: string;
      nameBn?: string;
      address?: string;
      addressBn?: string;
      phone?: string;
      email?: string;
      website?: string;
      logoUrl?: string;
      timezone?: string;
      currency?: string;
      uhidPrefix?: string;
    },
  ) {
    const exists = await this.prisma.hospital.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Hospital not found');

    return this.prisma.hospital.update({
      where: { id },
      data,
    });
  }

  async listBranches(hospitalId: string) {
    return this.prisma.branch.findMany({
      where: { hospitalId },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(
    hospitalId: string,
    data: {
      name: string;
      nameBn?: string;
      address?: string;
      phone?: string;
    },
    userId: string,
  ) {
    return this.prisma.branch.create({
      data: {
        ...data,
        hospitalId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateBranch(
    id: string,
    data: {
      name?: string;
      nameBn?: string;
      address?: string;
      phone?: string;
      isActive?: boolean;
    },
    userId: string,
  ) {
    const exists = await this.prisma.branch.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Branch not found');

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }
}
