import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant' })
  @Permissions('tenants', 'read')
  getMyTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.tenant.findFirst({
      where: { id: user.tenantId },
      select: {
        id: true, name: true, slug: true, cnpj: true, email: true,
        phone: true, plan: true, status: true, logoUrl: true, settings: true,
        createdAt: true, updatedAt: true,
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @Permissions('tenants', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, name: true, slug: true, plan: true, status: true, createdAt: true,
      },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant settings' })
  @Permissions('tenants', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; email?: string; phone?: string; settings?: object },
  ) {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
