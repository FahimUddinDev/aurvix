import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async listConfig(hospitalId: string) {
    return this.prisma.systemConfig.findMany({
      where: { hospitalId },
      orderBy: { key: 'asc' },
    });
  }

  async updateConfig(hospitalId: string, key: string, value: string, userId: string) {
    return this.prisma.systemConfig.upsert({
      where: {
        hospitalId_key: {
          hospitalId,
          key,
        },
      },
      update: {
        value,
        updatedBy: userId,
      },
      create: {
        hospitalId,
        key,
        value,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateUserLocale(userId: string, locale: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });

    return true;
  }
}
