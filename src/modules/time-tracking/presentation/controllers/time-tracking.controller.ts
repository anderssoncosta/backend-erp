import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { TimeTrackingService } from '../../application/services/time-tracking.service';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'time-tracking', version: '1' })
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start time entry' })
  @Permissions('time-tracking', 'create')
  start(
    @Body() body: { type?: string; description?: string; serviceOrderId?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timeTrackingService.start(tenantId, user.id, body);
  }

  @Patch(':id/stop')
  @ApiOperation({ summary: 'Stop time entry' })
  @Permissions('time-tracking', 'update')
  stop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { description?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timeTrackingService.stop(id, tenantId, user.id, body.description);
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
    return this.timeTrackingService.list(tenantId, userId, serviceOrderId, from, to, page, limit);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Time tracking summary by user' })
  @Permissions('time-tracking', 'read')
  summary(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.timeTrackingService.summary(tenantId, from, to);
  }
}
