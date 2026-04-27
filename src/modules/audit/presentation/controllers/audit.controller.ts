import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { AuditService } from '../../application/services/audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'List audit logs' })
  @Permissions('audit', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('severity') severity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.auditService.list(
      tenantId,
      module,
      action,
      entityType,
      entityId,
      userId,
      severity,
      from,
      to,
      page,
      limit,
    );
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get audit log detail' })
  @Permissions('audit', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.auditService.findOne(id, tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Audit statistics' })
  @Permissions('audit', 'read')
  stats(@CurrentTenant() tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.auditService.stats(tenantId, from, to);
  }
}
