import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateMaterialUseCase } from '../../application/use-cases/create-material/create-material.use-case';
import { CreateMaterialDto } from '../../application/use-cases/create-material/create-material.dto';
import { CreateGroupDto } from '../../application/use-cases/create-group/create-group.dto';
import { MaterialsService } from '../../application/services/materials.service';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'materials', version: '1' })
export class MaterialsController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly materialsService: MaterialsService,
  ) {}

  // ─── Groups ────────────────────────────────────────────────────────────────

  @Post('groups')
  @ApiOperation({ summary: 'Create material group' })
  @Permissions('materials', 'create')
  createGroup(@Body() dto: CreateGroupDto, @CurrentTenant() tenantId: string) {
    return this.materialsService.createGroup(tenantId, dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List material groups' })
  @Permissions('materials', 'read')
  listGroups(@CurrentTenant() tenantId: string) {
    return this.materialsService.listGroups(tenantId);
  }

  // ─── Materials ─────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create material' })
  @Permissions('materials', 'create')
  create(@Body() dto: CreateMaterialDto, @CurrentTenant() tenantId: string) {
    return this.createMaterialUseCase.execute(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List materials' })
  @Permissions('materials', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.materialsService.list(tenantId, search, groupId, isActive, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @Permissions('materials', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.materialsService.findOne(id, tenantId);
  }
}
