import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Works')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'works', version: '1' })
export class WorksController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Create work order' })
  @Permissions('works', 'create')
  create(
    @Body() body: {
      code: string; name: string; type: string; description?: string;
      clientId?: string; contractId?: string; managerId?: string;
      startDate?: string; endDate?: string; budget?: number;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.work.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        type: body.type,
        clientId: body.clientId,
        contractId: body.contractId,
        managerId: body.managerId ?? user.id,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        budget: body.budget,
        status: 'PLANNING',
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List works' })
  @Permissions('works', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('clientId') clientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.work.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(type && { type }),
        ...(clientId && { clientId }),
      },
      include: { _count: { select: { fronts: true, measurements: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work by ID' })
  @Permissions('works', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.work.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        fronts: true,
        measurements: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update work status' })
  @Permissions('works', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; progress?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.work.updateMany({
      where: { id, tenantId },
      data: { status: body.status, ...(body.progress !== undefined && { progress: body.progress }) },
    });
  }

  @Post(':id/fronts')
  @ApiOperation({ summary: 'Create work front' })
  @Permissions('works', 'create')
  createFront(
    @Param('id', ParseUUIDPipe) workId: string,
    @Body() body: { name: string; supervisorId?: string; notes?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.workFront.create({
      data: { tenantId, workId, name: body.name, supervisorId: body.supervisorId, notes: body.notes, status: 'ACTIVE' },
    });
  }

  @Post(':id/measurements')
  @ApiOperation({ summary: 'Register work measurement' })
  @Permissions('works', 'create')
  addMeasurement(
    @Param('id', ParseUUIDPipe) workId: string,
    @Body() body: {
      description: string; period: string; value: number;
      approvedById?: string; notes?: string;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.workMeasurement.create({
      data: {
        tenantId,
        workId,
        measuredById: user.id,
        description: body.description,
        period: body.period,
        value: body.value,
        approvedById: body.approvedById,
        approvedAt: body.approvedById ? new Date() : undefined,
        notes: body.notes,
        status: body.approvedById ? 'APPROVED' : 'PENDING',
      },
    });
  }
}
