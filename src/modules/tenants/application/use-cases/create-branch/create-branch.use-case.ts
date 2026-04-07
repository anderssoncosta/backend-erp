import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateBranchDto } from './create-branch.dto';

@Injectable()
export class CreateBranchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateBranchDto, tenantId: string) {
    const existing = await this.prisma.branch.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Branch code "${dto.code}" already exists`);

    return this.prisma.branch.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        regionId: dto.regionId ?? null,
        cnpj: dto.cnpj ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        isActive: true,
      },
    });
  }
}
