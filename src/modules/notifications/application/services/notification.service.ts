import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

export interface SendNotificationParams {
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel?: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async send(params: SendNotificationParams) {
    return this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data as Prisma.InputJsonValue,
        channel: params.channel ?? 'IN_APP',
        sentAt: new Date(),
      },
    });
  }

  async sendBulk(notifications: SendNotificationParams[]) {
    return this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        tenantId: n.tenantId,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data as Prisma.InputJsonValue,
        channel: n.channel ?? 'IN_APP',
        sentAt: new Date(),
      })),
    });
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { tenantId, userId, isRead: false } });
  }
}
