import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateContractDto } from './create-contract.dto';

@Injectable()
export class CreateContractUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateContractDto, tenantId: string): Promise<unknown> {
    const count = await this.prisma.contract.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const number = 'CTR-' + year + '-' + String(count + 1).padStart(5, '0');

    return this.prisma.contract.create({
      data: {
        tenantId, clientId: dto.clientId, number, title: dto.title, type: dto.type,
        status: 'DRAFT',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        value: dto.value, slaPolicy: dto.slaPolicy as object, terms: dto.terms, notes: dto.notes,
      },
      include: { client: { select: { id: true, name: true } }, serviceTypes: true },
    });
  }
}
