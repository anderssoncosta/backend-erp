import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateClientDto } from './create-client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateClientDto, tenantId: string) {
    if (dto.document) {
      const existing = await this.prisma.client.findFirst({ where: { tenantId, document: dto.document, deletedAt: null } });
      if (existing) throw new ConflictException('Client with document ' + dto.document + ' already exists');
    }
    return this.prisma.client.create({
      data: { ...dto, tenantId, status: 'ACTIVE' },
      include: { contacts: true, addresses: true },
    });
  }
}