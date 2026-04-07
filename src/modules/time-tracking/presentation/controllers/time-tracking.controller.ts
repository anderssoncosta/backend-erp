import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'time-tracking', version: '1' })
export class TimeTrackingController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start time entry' })
  @Permissions('time-tracking', 'create')
  async start(
    @Body() body: { type?: string; description?: string; serviceOrderId?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const active = await this.prisma.timeEntry.findFirst({
      where: { tenantId, userId: user.id, endedAt: null, status: 'RUNNING' },
    });
    if (active) {
      throw new BadRequestException('You already have an active time entry. Stop it first.');
    }

    return this.prisma.timeEntry.create({
      data: {
        tenantId,
        userId: user.id,
        startedAt: new Date(),
        type: body.type ?? 'REGULAR',
        description: body.description,
        serviceOrderId: body.serviceOrderId,
        status: 'RUNNING',
      },
    });
  }

  @Patch(':id/stop')
  @ApiOperation({ summary: 'Stop time entry' })
  @Permissions('time-tracking', 'update')
  async stop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { description?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, tenantId, userId: user.id, endedAt: null },
    });
    if (!entry) {
      throw new NotFoundException('Active time entry not found');
    }

    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - entry.startedAt.getTime()) / 60000);

    return this.prisma.timeEntry.update({
      where: { id },
      data: {
        endedAt,
        durationMinutes,
        status: 'COMPLETED',
        ...(body.description && { description: body.description }),
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List time entries' })
  @Permissions('time-tracking', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.findMany({
      where: {
        tenantId,
        ...(userId && { userId }),
        ...(serviceOrderId && { serviceOrderId }),
        ...(startedAt && { startedAt }),
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Time tracking summary by user' })
  @Permissions('time-tracking', 'read')
  async summary(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.timeEntry.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        endedAt: { not: null },
        ...(startedAt && { startedAt }),
      },
      _sum: { durationMinutes: true },
      _count: { id: true },
    });
  }
}
