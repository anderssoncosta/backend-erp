import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Public Lighting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'public-lighting', version: '1' })
export class PublicLightingController {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.lightingPoint.create({
      data: {
        tenantId,
        code: body.code,
        address: body.address,
        city: body.city,
        neighborhood: body.neighborhood,
        state: body.state ?? 'SP',
        latitude: body.latitude,
        longitude: body.longitude,
        type: body.type ?? 'POLE',
        lampType: body.lampType,
        power: body.power,
        branchId: body.branchId,
        status: 'ACTIVE',
      },
    });
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
    return this.prisma.lightingPoint.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(lampType && { lampType }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Patch('points/:id/status')
  @ApiOperation({ summary: 'Update lighting point status' })
  @Permissions('public-lighting', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.lightingPoint.updateMany({
      where: { id, tenantId },
      data: { status: body.status },
    });
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
    @CurrentUser() _user: AuthenticatedUser,
  ) {
    return this.prisma.lightingOrder.create({
      data: {
        tenantId,
        lightingPointId: body.lightingPointId,
        type: body.type,
        description: body.description,
        priority: body.priority ?? 'MEDIUM',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        technicianId: body.technicianId,
        status: 'PENDING',
      },
    });
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
    return this.prisma.lightingOrder.findMany({
      where: {
        tenantId,
        ...(status && { status }),
        ...(type && { type }),
        ...(technicianId && { technicianId }),
      },
      include: { lightingPoint: { select: { id: true, code: true, address: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Patch('orders/:id/complete')
  @ApiOperation({ summary: 'Complete lighting order' })
  @Permissions('public-lighting', 'update')
  completeOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string; completedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.lightingOrder.updateMany({
      where: { id, tenantId },
      data: {
        status: 'COMPLETED',
        completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
        notes: body.notes,
      },
    });
  }
}
