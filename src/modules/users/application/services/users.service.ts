import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { UpdateUserDto } from '../use-cases/update-user/update-user.dto';

const USER_SELECT = {
  id: true, tenantId: true, branchId: true, name: true, email: true,
  phone: true, role: true, status: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string, tenantId: string) {
    return this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null }, select: USER_SELECT });
  }

  update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE', deletedAt: new Date() },
    });
    return { message: 'User deactivated' };
  }

  getPermissions(userId: string) {
    return this.prisma.userPermission.findMany({
      where: { userId, isRevoked: false },
      include: { permission: true },
    });
  }

  assignPermissions(userId: string, permissionIds: string[], grantedById: string) {
    const data = permissionIds.map((permissionId) => ({
      userId, permissionId, grantedById,
    }));
    return this.prisma.userPermission.createMany({ data, skipDuplicates: true });
  }
}
