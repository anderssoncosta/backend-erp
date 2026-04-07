import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

export interface UploadOptions {
  resize?: { width: number; height: number };
  folder?: string;
}

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  mimeType: string;
  originalName: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    this.client = new S3Client({
      endpoint: config.get('S3_ENDPOINT'),
      region: config.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: config.get('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: config.get<boolean>('S3_FORCE_PATH_STYLE', true),
    });
  }

  async upload(
    file: Express.Multer.File,
    tenantId: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const folder = options.folder ?? 'uploads';
    const key = `${tenantId}/${folder}/${randomUUID()}${ext}`;
    const bucket = this.getBucket(file.mimetype);

    let buffer = file.buffer;

    if (file.mimetype.startsWith('image/') && options.resize) {
      try {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(buffer)
          .resize(options.resize.width, options.resize.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (err) {
        this.logger.warn('Image resize failed, uploading original', err);
      }
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
        ContentDisposition: `attachment; filename="${encodeURIComponent(file.originalname)}"`,
        Metadata: {
          tenantId,
          originalName: encodeURIComponent(file.originalname),
        },
      }),
    );

    this.logger.debug(`Uploaded file: ${key} (${bucket})`);

    return {
      key,
      bucket,
      size: buffer.length,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async getPresignedUrl(bucket: string, key: string, expiresIn?: number): Promise<string> {
    const ttl = expiresIn ?? this.config.get<number>('S3_PRESIGN_EXPIRES', 3600);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: ttl },
    );
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    this.logger.debug(`Deleted file: ${key} (${bucket})`);
  }

  private getBucket(mimeType: string): string {
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      return this.config.get('S3_BUCKET_MEDIA', 'erp-media');
    }
    return this.config.get('S3_BUCKET_DOCUMENTS', 'erp-documents');
  }
}
