import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'assets', version: '1' })
export class AssetsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Register asset' })
  @Permissions('assets', 'create')
  create(
    @Body() body: {
      code: string; name: string; type: string; category?: string;
      brand?: string; model?: string; serialNumber?: string;
      installDate?: string; warrantyUntil?: string; branchId?: string; location?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.asset.create({
      data: {
        tenantId,
        code: body.code,
        name: body.name,
        type: body.type,
        category: body.category,
        brand: body.brand,
        model: body.model,
        serialNumber: body.serialNumber,
        installDate: body.installDate ? new Date(body.installDate) : undefined,
        warrantyUntil: body.warrantyUntil ? new Date(body.warrantyUntil) : undefined,
        branchId: body.branchId,
        location: body.location,
        status: 'ACTIVE',
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List assets' })
  @Permissions('assets', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.asset.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status }),
        ...(category && { category }),
        ...(branchId && { branchId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { serialNumber: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @Permissions('assets', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.asset.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { history: { orderBy: { performedAt: 'desc' }, take: 10 } },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  @Permissions('assets', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string; location?: string; branchId?: string; warrantyUntil?: string; notes?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.asset.updateMany({
      where: { id, tenantId },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.warrantyUntil && { warrantyUntil: new Date(body.warrantyUntil) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
  }

  @Post(':id/history')
  @ApiOperation({ summary: 'Add asset history entry' })
  @Permissions('assets', 'create')
  addHistory(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() body: { type: string; description: string; performedAt?: string; performedById?: string; cost?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.assetHistory.create({
      data: {
        tenantId,
        assetId,
        type: body.type,
        description: body.description,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
        performedById: body.performedById,
        cost: body.cost,
      },
    });
  }
}
