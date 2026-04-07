import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateMaterialDto } from './create-material.dto';

@Injectable()
export class CreateMaterialUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateMaterialDto, tenantId: string) {
    const existing = await this.prisma.material.findFirst({
      where: { tenantId, code: dto.code, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Material with code '${dto.code}' already exists`);
    }

    return this.prisma.material.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        unit: dto.unit ?? 'UN',
        groupId: dto.groupId,
        minStock: dto.minStock ?? 0,
        maxStock: dto.maxStock,
        costPrice: dto.costPrice ?? 0,
        isActive: true,
      },
      include: { group: true },
    });
  }
}
