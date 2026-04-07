import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { UpdateClientDto } from './update-client.dto';

@Injectable()
export class UpdateClientUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(id: string, dto: UpdateClientDto, tenantId: string) {
    const client = await this.prisma.client.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!client) throw new NotFoundException('Client not found');
    return this.prisma.client.update({ where: { id }, data: dto, include: { contacts: true, addresses: true } });
  }
}
