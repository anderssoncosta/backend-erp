import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { CreateScheduleUseCase } from '../../application/use-cases/create-schedule/create-schedule.use-case';
import { CreateScheduleDto } from '../../application/use-cases/create-schedule/create-schedule.dto';
import { SchedulingService } from '../../application/services/scheduling.service';

@ApiTags('Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'scheduling', version: '1' })
export class SchedulingController {
  constructor(
    private readonly createScheduleUseCase: CreateScheduleUseCase,
    private readonly schedulingService: SchedulingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create schedule' })
  @Permissions('scheduling', 'create')
  create(
    @Body() dto: CreateScheduleDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createScheduleUseCase.execute(dto, tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List schedules' })
  @Permissions('scheduling', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.schedulingService.list(tenantId, userId, from, to, status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @Permissions('scheduling', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.schedulingService.findOne(id, tenantId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel schedule' })
  @Permissions('scheduling', 'update')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.schedulingService.cancel(id, tenantId, body.reason);
  }
}
