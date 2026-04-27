import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { AssetsService } from '../../application/services/assets.service';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'assets', version: '1' })
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

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
    return this.assetsService.create(tenantId, body);
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
    return this.assetsService.list(tenantId, status, category, branchId, search, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @Permissions('assets', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.assetsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  @Permissions('assets', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string; location?: string; branchId?: string; warrantyUntil?: string; notes?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.assetsService.update(id, tenantId, body);
  }

  @Post(':id/history')
  @ApiOperation({ summary: 'Add asset history entry' })
  @Permissions('assets', 'create')
  addHistory(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() body: { type: string; description: string; performedAt?: string; performedById?: string; cost?: number },
    @CurrentTenant() tenantId: string,
  ) {
    return this.assetsService.addHistory(assetId, tenantId, body);
  }
}
