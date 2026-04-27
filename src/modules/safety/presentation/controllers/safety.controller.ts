import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { SafetyService } from '../../application/services/safety.service';

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'safety', version: '1' })
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // ─── Safety Documents ──────────────────────────────────────────────────────

  @Post('documents')
  @ApiOperation({ summary: 'Create safety document' })
  @Permissions('safety', 'create')
  createDocument(
    @Body() body: { type: string; title: string; description?: string; expiresAt?: string; fileUrl?: string; userId?: string; issuedAt?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.safetyService.createDocument(tenantId, user.id, body);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List safety documents' })
  @Permissions('safety', 'read')
  listDocuments(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.safetyService.listDocuments(tenantId, type, userId, status, page, limit);
  }

  // ─── PPE Deliveries ────────────────────────────────────────────────────────

  @Post('ppe-deliveries')
  @ApiOperation({ summary: 'Register PPE delivery' })
  @Permissions('safety', 'create')
  registerPPE(
    @Body() body: { userId: string; item: string; quantity: number; notes?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.safetyService.registerPPE(tenantId, user.id, body);
  }

  @Get('ppe-deliveries')
  @ApiOperation({ summary: 'List PPE deliveries' })
  @Permissions('safety', 'read')
  listPPE(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.safetyService.listPPE(tenantId, userId, page, limit);
  }

  // ─── Incidents ─────────────────────────────────────────────────────────────

  @Post('incidents')
  @ApiOperation({ summary: 'Report incident' })
  @Permissions('safety', 'create')
  reportIncident(
    @Body() body: { type: string; severity?: string; description: string; occurredAt?: string; location?: string; injuries?: boolean },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.safetyService.reportIncident(tenantId, user.id, body);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List incidents' })
  @Permissions('safety', 'read')
  listIncidents(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.safetyService.listIncidents(tenantId, type, severity, status, page, limit);
  }

  @Patch('incidents/:id/close')
  @ApiOperation({ summary: 'Close incident' })
  @Permissions('safety', 'update')
  closeIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { correctiveAction: string; resolvedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.safetyService.closeIncident(id, tenantId, body.correctiveAction, body.resolvedAt);
  }
}
