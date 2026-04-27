import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { S3Service } from '@infrastructure/storage/s3.service';

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async remove(id: string) {
    await this.prisma.serviceOrder.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Service order deleted' };
  }

  getComments(serviceOrderId: string, userId: string) {
    return this.prisma.serviceOrderComment.findMany({
      where: {
        serviceOrderId,
        deletedAt: null,
        OR: [
          { isInternal: false },
          { isInternal: true, authorId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  getHistory(serviceOrderId: string) {
    return this.prisma.serviceOrderHistory.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadAttachment(
    serviceOrderId: string,
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ) {
    const result = await this.s3.upload(file, tenantId, {
      folder: `service-orders/${serviceOrderId}`,
    });

    return this.prisma.serviceOrderAttachment.create({
      data: {
        serviceOrderId,
        uploadedById: userId,
        fileName: result.key.split('/').pop() ?? file.originalname,
        originalName: file.originalname,
        mimeType: result.mimeType,
        size: result.size,
        s3Key: result.key,
        s3Bucket: result.bucket,
      },
    });
  }

  async getAttachments(serviceOrderId: string) {
    const attachments = await this.prisma.serviceOrderAttachment.findMany({
      where: { serviceOrderId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      attachments.map(async (a) => ({
        ...a,
        url: await this.s3.getPresignedUrl(a.s3Bucket, a.s3Key),
      })),
    );
  }
}
