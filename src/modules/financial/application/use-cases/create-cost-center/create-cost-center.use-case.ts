import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateCostCenterDto } from './create-cost-center.dto';

@Injectable()
export class CreateCostCenterUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateCostCenterDto, tenantId: string) {
    const existing = await this.prisma.costCenter.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Cost center with code ${dto.code} already exists`);

    return this.prisma.costCenter.create({
      data: { ...dto, tenantId, isActive: true },
    });
  }
}
