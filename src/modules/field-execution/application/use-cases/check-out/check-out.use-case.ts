import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CheckOutDto } from './check-out.dto';

@Injectable()
export class CheckOutUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(executionId: string, dto: CheckOutDto, tenantId: string, userId: string) {
    const execution = await this.prisma.fieldExecution.findFirst({
      where: { id: executionId, tenantId, userId, checkOutAt: null },
    });
    if (!execution) {
      throw new NotFoundException('Active field execution not found');
    }

    const checkOutAt = new Date();
    const checkInAt = execution.checkInAt ?? new Date();
    const durationMinutes = Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000);

    return this.prisma.fieldExecution.update({
      where: { id: executionId },
      data: {
        checkOutAt,
        checkOutLat: dto.latitude,
        checkOutLng: dto.longitude,
        notes: dto.notes ? `${execution.notes ?? ''}\n${dto.notes}`.trim() : execution.notes,
        status: dto.completionStatus,
        durationMinutes,
      },
    });
  }
}
