import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async listDepartments(hospitalId: string) {
    return this.prisma.department.findMany({
      where: { hospitalId },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(
    hospitalId: string,
    data: {
      name: string;
      nameBn?: string;
      code: string;
      description?: string;
    },
    userId: string,
  ) {
    return this.prisma.department.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
        hospitalId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateDepartment(
    id: string,
    data: {
      name?: string;
      nameBn?: string;
      code?: string;
      description?: string;
      isActive?: boolean;
    },
    userId: string,
  ) {
    const exists = await this.prisma.department.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Department not found');

    const updateData: any = { ...data };
    if (data.code) {
      updateData.code = data.code.toUpperCase();
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
      },
    });
  }
}
