import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CheckInDto } from './check-in.dto';

@Injectable()
export class CheckInUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CheckInDto, tenantId: string, userId: string) {
    const active = await this.prisma.fieldExecution.findFirst({
      where: { tenantId, userId, checkOutAt: null },
    });
    if (active) {
      throw new BadRequestException('You already have an active check-in. Check out first.');
    }

    return this.prisma.fieldExecution.create({
      data: {
        tenantId,
        userId,
        serviceOrderId: dto.serviceOrderId,
        checkInAt: new Date(),
        checkInLat: dto.latitude,
        checkInLng: dto.longitude,
        notes: dto.notes,
        status: 'IN_PROGRESS',
      },
    });
  }
}
