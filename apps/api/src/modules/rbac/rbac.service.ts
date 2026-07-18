import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  }

  async createRole(data: { name: string; displayName: string; description?: string }) {
    const exists = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (exists) throw new BadRequestException('Role name already exists');

    return this.prisma.role.create({
      data: {
        name: data.name.toUpperCase(),
        displayName: data.displayName,
        description: data.description,
        isSystem: false,
      },
    });
  }

  async updateRole(id: string, data: { displayName?: string; description?: string }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    return this.prisma.role.delete({ where: { id } });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Run in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all current permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Insert new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permId) => ({
            roleId,
            permissionId: permId,
          })),
        });
      }

      return tx.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });
    });
  }
}
