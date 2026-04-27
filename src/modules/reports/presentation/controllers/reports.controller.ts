import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { ReportsService } from '../../application/services/reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('service-orders')
  @ApiOperation({ summary: 'Service orders report' })
  @Permissions('reports', 'read')
  serviceOrders(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.serviceOrders(tenantId, from, to);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory report' })
  @Permissions('reports', 'read')
  inventory(@CurrentTenant() tenantId: string) {
    return this.reportsService.inventory(tenantId);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Financial report' })
  @Permissions('reports', 'read')
  financial(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.financial(tenantId, from, to);
  }

  @Get('hr')
  @ApiOperation({ summary: 'HR report' })
  @Permissions('reports', 'read')
  hr(@CurrentTenant() tenantId: string) {
    return this.reportsService.hr(tenantId);
  }

  @Get('fleet')
  @ApiOperation({ summary: 'Fleet report' })
  @Permissions('reports', 'read')
  fleet(@CurrentTenant() tenantId: string) {
    return this.reportsService.fleet(tenantId);
  }

  @Get('productivity')
  @ApiOperation({ summary: 'Team productivity report' })
  @Permissions('reports', 'read')
  productivity(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.productivity(tenantId, from, to);
  }
}
