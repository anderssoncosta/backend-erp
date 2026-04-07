import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Safety')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'safety', version: '1' })
export class SafetyController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Safety Documents ──────────────────────────────────────────────────────

  @Post('documents')
  @ApiOperation({ summary: 'Create safety document' })
  @Permissions('safety', 'create')
  createDocument(
    @Body() body: {
      type: string; title: string; description?: string; expiresAt?: string;
      fileUrl?: string; userId?: string; issuedAt?: string;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.safetyDocument.create({
      data: {
        tenantId,
        type: body.type,
        title: body.title,
        description: body.description,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
        fileUrl: body.fileUrl,
        userId: body.userId ?? user.id,
        status: 'VALID',
      },
    });
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
    return this.prisma.safetyDocument.findMany({
      where: {
        tenantId,
        ...(type && { type }),
        ...(userId && { userId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
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
    return this.prisma.pPEDelivery.create({
      data: {
        tenantId,
        userId: body.userId,
        receivedById: user.id,
        item: body.item,
        quantity: body.quantity,
        deliveredAt: new Date(),
        notes: body.notes,
      },
    });
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
    return this.prisma.pPEDelivery.findMany({
      where: { tenantId, ...(userId && { userId }) },
      orderBy: { deliveredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // ─── Incidents ─────────────────────────────────────────────────────────────

  @Post('incidents')
  @ApiOperation({ summary: 'Report incident' })
  @Permissions('safety', 'create')
  reportIncident(
    @Body() body: {
      type: string; severity?: string; description: string;
      occurredAt?: string; location?: string; injuries?: boolean;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.incident.create({
      data: {
        tenantId,
        reportedById: user.id,
        type: body.type,
        severity: body.severity ?? 'MEDIUM',
        description: body.description,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        location: body.location,
        injuries: body.injuries ?? false,
        status: 'OPEN',
      },
    });
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
    return this.prisma.incident.findMany({
      where: {
        tenantId,
        ...(type && { type }),
        ...(severity && { severity }),
        ...(status && { status }),
      },
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Patch('incidents/:id/close')
  @ApiOperation({ summary: 'Close incident' })
  @Permissions('safety', 'update')
  closeIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { correctiveAction: string; resolvedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.incident.updateMany({
      where: { id, tenantId },
      data: {
        status: 'CLOSED',
        correctiveAction: body.correctiveAction,
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : new Date(),
      },
    });
  }
}
