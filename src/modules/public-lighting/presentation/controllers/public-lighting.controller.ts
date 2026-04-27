import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PublicLightingService } from '../../application/services/public-lighting.service';

@ApiTags('Public Lighting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'public-lighting', version: '1' })
export class PublicLightingController {
  constructor(private readonly publicLightingService: PublicLightingService) {}

  // ─── Lighting Points ───────────────────────────────────────────────────────

  @Post('points')
  @ApiOperation({ summary: 'Register lighting point' })
  @Permissions('public-lighting', 'create')
  createPoint(
    @Body() body: {
      code: string; address: string; city: string; neighborhood?: string; state?: string;
      latitude?: number; longitude?: number; type?: string; lampType?: string;
      power?: number; branchId?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.publicLightingService.createPoint(tenantId, body);
  }

  @Get('points')
  @ApiOperation({ summary: 'List lighting points' })
  @Permissions('public-lighting', 'read')
  listPoints(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('lampType') lampType?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.publicLightingService.listPoints(tenantId, status, lampType, search, page, limit);
  }

  @Patch('points/:id/status')
  @ApiOperation({ summary: 'Update lighting point status' })
  @Permissions('public-lighting', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.publicLightingService.updatePointStatus(id, tenantId, body.status);
  }

  // ─── Lighting Orders ───────────────────────────────────────────────────────

  @Post('orders')
  @ApiOperation({ summary: 'Create lighting order' })
  @Permissions('public-lighting', 'create')
  createOrder(
    @Body() body: {
      lightingPointId: string; type: string; description: string;
      priority?: string; scheduledAt?: string; technicianId?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.publicLightingService.createOrder(tenantId, body);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List lighting orders' })
  @Permissions('public-lighting', 'read')
  listOrders(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('technicianId') technicianId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.publicLightingService.listOrders(tenantId, status, type, technicianId, page, limit);
  }

  @Patch('orders/:id/complete')
  @ApiOperation({ summary: 'Complete lighting order' })
  @Permissions('public-lighting', 'update')
  completeOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string; completedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.publicLightingService.completeOrder(id, tenantId, body.notes, body.completedAt);
  }
}
