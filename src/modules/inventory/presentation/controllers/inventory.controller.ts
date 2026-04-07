import {
  Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { RegisterEntryUseCase } from '../../application/use-cases/register-entry/register-entry.use-case';
import { RegisterExitUseCase } from '../../application/use-cases/register-exit/register-exit.use-case';
import { TransferStockUseCase } from '../../application/use-cases/transfer-stock/transfer-stock.use-case';
import { RegisterEntryDto } from '../../application/use-cases/register-entry/register-entry.dto';
import { RegisterExitDto } from '../../application/use-cases/register-exit/register-exit.dto';
import { TransferStockDto } from '../../application/use-cases/transfer-stock/transfer-stock.dto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(
    private readonly registerEntryUseCase: RegisterEntryUseCase,
    private readonly registerExitUseCase: RegisterExitUseCase,
    private readonly transfer: TransferStockUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stock')
  @ApiOperation({ summary: 'List stock positions' })
  @Permissions('inventory', 'read')
  async getStock(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.prisma.stockItem.findMany({
      where: { tenantId, ...(branchId && { branchId }), isActive: true },
      include: { material: { select: { id: true, code: true, name: true, unit: true, minStock: true } } },
    });
  }

  @Post('movements/entry')
  @ApiOperation({ summary: 'Register stock entry' })
  @Permissions('inventory', 'create')
  registerEntry(
    @Body() dto: RegisterEntryDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registerEntryUseCase.execute(dto, tenantId, user.id);
  }

  @Post('movements/exit')
  @ApiOperation({ summary: 'Register stock exit' })
  @Permissions('inventory', 'create')
  registerExit(
    @Body() dto: RegisterExitDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.registerExitUseCase.execute(dto, tenantId, user.id);
  }

  @Get('movements')
  @ApiOperation({ summary: 'List stock movements' })
  @Permissions('inventory', 'read')
  getMovements(
    @CurrentTenant() tenantId: string,
    @Query('materialId') materialId?: string,
    @Query('branchId') branchId?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.stockMovement.findMany({
      where: {
        tenantId,
        ...(materialId && { materialId }),
        ...(branchId && { branchId }),
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create and execute stock transfer' })
  @Permissions('inventory', 'create')
  createTransfer(
    @Body() dto: TransferStockDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transfer.execute(dto, tenantId, user.id);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List transfers' })
  @Permissions('inventory', 'read')
  getTransfers(@CurrentTenant() tenantId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.prisma.stockTransfer.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    });
  }

  @Get('materials')
  @ApiOperation({ summary: 'List materials' })
  @Permissions('inventory', 'read')
  getMaterials(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.material.findMany({
      where: {
        tenantId, deletedAt: null, isActive: true,
        ...(search && { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ]}),
      },
      include: { group: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit, take: limit,
    });
  }

  @Post('materials')
  @ApiOperation({ summary: 'Create material' })
  @Permissions('inventory', 'create')
  createMaterial(
    @Body() data: {
      code: string; name: string; description?: string; unit?: string;
      groupId?: string; minStock?: number; maxStock?: number; costPrice?: number;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.prisma.material.create({ data: { ...data, tenantId, isActive: true } });
  }

  @Get('materials/:id')
  @ApiOperation({ summary: 'Get material by ID' })
  @Permissions('inventory', 'read')
  getMaterial(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.material.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { group: true },
    });
  }
}
