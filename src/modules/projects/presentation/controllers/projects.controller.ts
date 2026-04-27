import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { ProjectsService } from '../../application/services/projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── Projects ──────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @Permissions('projects', 'create')
  create(
    @Body() body: {
      code: string; name: string; description?: string; clientId?: string; contractId?: string;
      managerId?: string; startDate?: string; endDate?: string; budget?: number;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.create(tenantId, user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @Permissions('projects', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('managerId') managerId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.projectsService.list(tenantId, status, clientId, managerId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @Permissions('projects', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.projectsService.findOne(id, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  @Permissions('projects', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; progress?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.projectsService.updateStatus(id, tenantId, body.status, body.progress);
  }

  // ─── Phases ────────────────────────────────────────────────────────────────

  @Post(':id/phases')
  @ApiOperation({ summary: 'Create project phase' })
  @Permissions('projects', 'create')
  createPhase(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: { name: string; description?: string; order?: number; startDate?: string; endDate?: string },
  ) {
    return this.projectsService.createPhase(projectId, body);
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Create project task' })
  @Permissions('projects', 'create')
  createTask(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: {
      phaseId?: string; title: string; description?: string;
      assignedToId?: string; dueDate?: string; priority?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.projectsService.createTask(projectId, tenantId, body);
  }

  @Patch('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  @Permissions('projects', 'update')
  updateTaskStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { status: string; completedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.projectsService.updateTaskStatus(taskId, tenantId, body.status, body.completedAt);
  }
}
