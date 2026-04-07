import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Call Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'call-center', version: '1' })
export class CallCenterController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('calls')
  @ApiOperation({ summary: 'Register call record' })
  @Permissions('call-center', 'create')
  registerCall(
    @Body() body: {
      clientPhone: string; subject: string; description?: string;
      clientId?: string; clientName?: string; channel?: string;
      serviceOrderId?: string; notes?: string;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.callRecord.create({
      data: {
        tenantId,
        attendantId: user.id,
        clientPhone: body.clientPhone,
        subject: body.subject,
        description: body.description,
        clientId: body.clientId,
        clientName: body.clientName,
        channel: body.channel ?? 'PHONE',
        serviceOrderId: body.serviceOrderId,
        notes: body.notes,
        startedAt: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  @Patch('calls/:id/end')
  @ApiOperation({ summary: 'End a call' })
  @Permissions('call-center', 'update')
  async endCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { notes?: string; outcome?: string },
    @CurrentTenant() tenantId: string,
  ) {
    const call = await this.prisma.callRecord.findFirst({ where: { id, tenantId } });
    if (!call) throw new Error('Call not found');

    const endedAt = new Date();
    const duration = Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000);

    return this.prisma.callRecord.update({
      where: { id },
      data: {
        endedAt,
        duration,
        status: 'COMPLETED',
        ...(body.outcome && { outcome: body.outcome }),
        ...(body.notes && { notes: body.notes }),
      },
    });
  }

  @Get('calls')
  @ApiOperation({ summary: 'List calls' })
  @Permissions('call-center', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('attendantId') attendantId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    return this.prisma.callRecord.findMany({
      where: {
        tenantId,
        ...(attendantId && { attendantId }),
        ...(clientId && { clientId }),
        ...(status && { status }),
        ...(startedAt && { startedAt }),
      },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Call center statistics' })
  @Permissions('call-center', 'read')
  async stats(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
    const startedAt = Object.keys(dateFilter).length ? dateFilter : undefined;

    const [total, byChannel, byAttendant] = await Promise.all([
      this.prisma.callRecord.count({ where: { tenantId, ...(startedAt && { startedAt }) } }),
      this.prisma.callRecord.groupBy({
        by: ['channel'],
        where: { tenantId, ...(startedAt && { startedAt }) },
        _count: { id: true },
      }),
      this.prisma.callRecord.groupBy({
        by: ['attendantId'],
        where: { tenantId, ...(startedAt && { startedAt }) },
        _count: { id: true },
        _avg: { duration: true },
      }),
    ]);

    return { total, byChannel, byAttendant };
  }
}
