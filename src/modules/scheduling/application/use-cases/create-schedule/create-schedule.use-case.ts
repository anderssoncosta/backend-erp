import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateScheduleDto } from './create-schedule.dto';

@Injectable()
export class CreateScheduleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateScheduleDto, tenantId: string, createdById: string) {
    const scheduledDate = new Date(dto.startAt);
    const endDate = dto.endAt ? new Date(dto.endAt) : undefined;

    if (endDate && endDate <= scheduledDate) {
      throw new ConflictException('End time must be after start time');
    }

    // Check for scheduling conflicts for the same user
    if (endDate) {
      const conflict = await this.prisma.schedule.findFirst({
        where: {
          tenantId,
          userId: dto.userId,
          status: { notIn: ['CANCELLED'] },
          scheduledDate: { lt: endDate },
          endDate: { gt: scheduledDate },
        },
      });
      if (conflict) {
        throw new ConflictException(`Scheduling conflict: user already has schedule "${conflict.title}"`);
      }
    }

    return this.prisma.schedule.create({
      data: {
        tenantId,
        userId: dto.userId,
        serviceOrderId: dto.serviceOrderId,
        title: dto.title,
        description: dto.description,
        scheduledDate,
        endDate,
        priority: dto.priority ?? 'MEDIUM',
        status: 'SCHEDULED',
        createdById,
      },
    });
  }
}
