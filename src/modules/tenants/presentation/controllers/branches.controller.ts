import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateBranchUseCase } from '../../application/use-cases/create-branch/create-branch.use-case';
import { ListBranchesUseCase } from '../../application/use-cases/list-branches/list-branches.use-case';
import { CreateBranchDto } from '../../application/use-cases/create-branch/create-branch.dto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'branches', version: '1' })
export class BranchesController {
  constructor(
    private readonly createUC: CreateBranchUseCase,
    private readonly listUC: ListBranchesUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create branch' })
  @Permissions('tenants', 'create')
  create(@Body() dto: CreateBranchDto, @CurrentTenant() tenantId: string) {
    return this.createUC.execute(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List branches' })
  @Permissions('tenants', 'read')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listUC.execute(tenantId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @Permissions('tenants', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.branch.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  @Permissions('tenants', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<CreateBranchDto>,
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete branch' })
  @Permissions('tenants', 'delete')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Branch deleted' };
  }
}
