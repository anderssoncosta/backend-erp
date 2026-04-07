import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'audit', version: '1' })
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

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
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(module && { module }),
        ...(action && { action }),
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
        ...(userId && { userId }),
        ...(severity && { severity }),
        ...(createdAt && { createdAt }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get audit log detail' })
  @Permissions('audit', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.auditLog.findFirst({ where: { id, tenantId } });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Audit statistics' })
  @Permissions('audit', 'read')
  async stats(@CurrentTenant() tenantId: string, @Query('from') from?: string, @Query('to') to?: string) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const createdAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [byModule, bySeverity, total] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['module'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where: { tenantId, ...(createdAt && { createdAt }) },
        _count: { id: true },
      }),
      this.prisma.auditLog.count({ where: { tenantId, ...(createdAt && { createdAt }) } }),
    ]);

    return { total, byModule, bySeverity };
  }
}
