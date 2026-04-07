import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'projects', version: '1' })
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Projects ──────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create project' })
  @Permissions('projects', 'create')
  async create(
    @Body() body: {
      code: string; name: string; description?: string; clientId?: string; contractId?: string;
      managerId?: string; startDate?: string; endDate?: string; budget?: number;
    },
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.prisma.project.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        description: body.description,
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
    return this.prisma.project.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(managerId && { managerId }),
      },
      include: { _count: { select: { phases: true, tasks: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @Permissions('projects', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        phases: { include: { tasks: true }, orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  @Permissions('projects', 'update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; progress?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.project.updateMany({
      where: { id, tenantId },
      data: { status: body.status, ...(body.progress !== undefined && { progress: body.progress }) },
    });
  }

  // ─── Phases ────────────────────────────────────────────────────────────────

  @Post(':id/phases')
  @ApiOperation({ summary: 'Create project phase' })
  @Permissions('projects', 'create')
  createPhase(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: { name: string; description?: string; order?: number; startDate?: string; endDate?: string },
  ) {
    return this.prisma.projectPhase.create({
      data: {
        projectId,
        name: body.name,
        description: body.description,
        order: body.order ?? 1,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: 'PENDING',
      },
    });
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
    return this.prisma.projectTask.create({
      data: {
        tenantId,
        projectId,
        phaseId: body.phaseId,
        title: body.title,
        description: body.description,
        assignedToId: body.assignedToId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        priority: body.priority ?? 'MEDIUM',
        status: 'TODO',
      },
    });
  }

  @Patch('tasks/:taskId/status')
  @ApiOperation({ summary: 'Update task status' })
  @Permissions('projects', 'update')
  updateTaskStatus(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { status: string; completedAt?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.projectTask.updateMany({
      where: { id: taskId, tenantId },
      data: {
        status: body.status,
        ...(body.completedAt && { completedAt: new Date(body.completedAt) }),
        ...(body.status === 'DONE' && !body.completedAt && { completedAt: new Date() }),
      },
    });
  }
}
