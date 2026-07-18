import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { hashPassword } from '../../common/utils/encryption.util';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string;
    hospitalId: string;
  }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new BadRequestException('Email already registered');

    // Hash the password
    const hashed = await hashPassword(data.passwordHash);

    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash: hashed,
        status: UserStatus.ACTIVE,
      },
      include: { role: true },
    });
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      roleId?: string;
      status?: UserStatus;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async deactivateUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.INACTIVE },
      include: { role: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async listUsers(
    hospitalId: string,
    filters: { roleId?: string; status?: UserStatus; query?: string },
    pagination: { page: number; limit: number },
  ) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      hospitalId,
      ...(filters.roleId ? { roleId: filters.roleId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.query
        ? {
            OR: [
              { email: { contains: filters.query, mode: 'insensitive' } },
              { firstName: { contains: filters.query, mode: 'insensitive' } },
              { lastName: { contains: filters.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
