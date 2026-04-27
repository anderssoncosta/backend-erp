import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { UpsertSettingDto } from '../use-cases/upsert-setting/upsert-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, module?: string) {
    return this.prisma.systemSetting.findMany({
      where: { tenantId, ...(module && { module }) },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
  }

  get(tenantId: string, module: string, key: string) {
    return this.prisma.systemSetting.findUnique({
      where: { tenantId_module_key: { tenantId, module, key } },
    });
  }

  upsert(tenantId: string, userId: string, dto: UpsertSettingDto) {
    return this.prisma.systemSetting.upsert({
      where: { tenantId_module_key: { tenantId, module: dto.module, key: dto.key } },
      update: { value: dto.value as object, label: dto.label, description: dto.description, updatedById: userId },
      create: {
        tenantId,
        module: dto.module,
        key: dto.key,
        value: dto.value as object,
        label: dto.label,
        description: dto.description,
        updatedById: userId,
      },
    });
  }

  remove(id: string, tenantId: string) {
    return this.prisma.systemSetting.deleteMany({ where: { id, tenantId } });
  }
}
