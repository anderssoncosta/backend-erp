import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateUserDto, tenantId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (existing) throw new ConflictException('User with this email already exists');

    const hash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        tenantId,
        branchId: dto.branchId ?? null,
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: hash,
        phone: dto.phone ?? null,
        role: dto.role ?? 'OPERATOR',
        status: 'ACTIVE',
      },
      select: {
        id: true, tenantId: true, branchId: true, name: true,
        email: true, phone: true, role: true, status: true, createdAt: true,
      },
    });
  }
}
