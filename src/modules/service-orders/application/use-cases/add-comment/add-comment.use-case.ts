import { Inject, Injectable } from '@nestjs/common';
import {
  IServiceOrderRepository,
  SERVICE_ORDER_REPOSITORY,
} from '../../../domain/repositories/service-order.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { EntityNotFoundException } from '@shared/exceptions/not-found.exception';
import { AddCommentDto } from './add-comment.dto';

@Injectable()
export class AddCommentUseCase {
  constructor(
    @Inject(SERVICE_ORDER_REPOSITORY)
    private readonly repository: IServiceOrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    serviceOrderId: string,
    dto: AddCommentDto,
    tenantId: string,
    actorId: string,
  ): Promise<{ id: string; content: string; isInternal: boolean; createdAt: Date }> {
    const order = await this.repository.findById(serviceOrderId, tenantId);
    if (!order) throw new EntityNotFoundException('ServiceOrder', serviceOrderId);

    const comment = await this.prisma.serviceOrderComment.create({
      data: {
        serviceOrderId,
        authorId: actorId,
        content: dto.content,
        isInternal: dto.isInternal ?? false,
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      isInternal: comment.isInternal,
      createdAt: comment.createdAt,
    };
  }
}
