import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { WorksService } from '../../application/services/works.service';

@ApiTags('Works')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'works', version: '1' })
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

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
    return this.worksService.create(tenantId, user.id, body);
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
    return this.worksService.list(tenantId, status, type, clientId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work by ID' })
  @Permissions('works', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.worksService.findOne(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update work status' })
  @Permissions('works', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; progress?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.worksService.updateStatus(id, tenantId, body.status, body.progress);
  }

  @Post(':id/fronts')
  @ApiOperation({ summary: 'Create work front' })
  @Permissions('works', 'create')
  createFront(
    @Param('id', ParseUUIDPipe) workId: string,
    @Body() body: { name: string; supervisorId?: string; notes?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.worksService.createFront(workId, tenantId, body);
  }

  @Post(':id/measurements')
  @ApiOperation({ summary: 'Register work measurement' })
  @Permissions('works', 'create')
  addMeasurement(
    @Param('id', ParseUUIDPipe) workId: string,
    @Body() body: { description: string; period: string; value: number; approvedById?: string; notes?: string },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.worksService.addMeasurement(workId, tenantId, user.id, body);
  }
}
