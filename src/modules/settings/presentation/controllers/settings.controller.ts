import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { UpsertSettingDto } from '../../application/use-cases/upsert-setting/upsert-setting.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all settings' })
  @Permissions('settings', 'read')
  list(@CurrentTenant() tenantId: string, @Query('module') module?: string) {
    return this.prisma.systemSetting.findMany({
      where: { tenantId, ...(module && { module }) },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
  }

  @Get(':module/:key')
  @ApiOperation({ summary: 'Get setting by module and key' })
  @Permissions('settings', 'read')
  get(@Param('module') module: string, @Param('key') key: string, @CurrentTenant() tenantId: string) {
    return this.prisma.systemSetting.findUnique({
      where: { tenantId_module_key: { tenantId, module, key } },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create or update setting' })
  @Permissions('settings', 'update')
  upsert(@Body() dto: UpsertSettingDto, @CurrentTenant() tenantId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.prisma.systemSetting.upsert({
      where: { tenantId_module_key: { tenantId, module: dto.module, key: dto.key } },
      update: { value: dto.value as object, label: dto.label, description: dto.description, updatedById: user.id },
      create: {
        tenantId,
        module: dto.module,
        key: dto.key,
        value: dto.value as object,
        label: dto.label,
        description: dto.description,
        updatedById: user.id,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete setting' })
  @Permissions('settings', 'delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.systemSetting.deleteMany({ where: { id, tenantId } });
  }
}
