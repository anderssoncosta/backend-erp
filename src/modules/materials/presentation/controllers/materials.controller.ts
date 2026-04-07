import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateMaterialUseCase } from '../../application/use-cases/create-material/create-material.use-case';
import { CreateMaterialDto } from '../../application/use-cases/create-material/create-material.dto';
import { CreateGroupDto } from '../../application/use-cases/create-group/create-group.dto';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'materials', version: '1' })
export class MaterialsController {
  constructor(
    private readonly createMaterialUseCase: CreateMaterialUseCase,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Groups ────────────────────────────────────────────────────────────────

  @Post('groups')
  @ApiOperation({ summary: 'Create material group' })
  @Permissions('materials', 'create')
  createGroup(@Body() dto: CreateGroupDto, @CurrentTenant() tenantId: string) {
    return this.prisma.materialGroup.create({ data: { ...dto, tenantId } });
  }

  @Get('groups')
  @ApiOperation({ summary: 'List material groups' })
  @Permissions('materials', 'read')
  listGroups(@CurrentTenant() tenantId: string) {
    return this.prisma.materialGroup.findMany({
      where: { tenantId },
      include: { _count: { select: { materials: true } } },
      orderBy: { name: 'asc' },
    });
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
    return this.prisma.material.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
        ...(groupId && { groupId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { group: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @Permissions('materials', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.material.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { group: true, stockItems: { select: { id: true, branchId: true, quantity: true, availableQty: true, location: true } } },
    });
  }
}
