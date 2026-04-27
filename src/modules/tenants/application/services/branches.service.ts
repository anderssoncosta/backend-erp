import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateBranchDto } from '../use-cases/create-branch/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string, tenantId: string) {
    return this.prisma.branch.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  update(id: string, data: Partial<CreateBranchDto>) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Branch deleted' };
  }
}
