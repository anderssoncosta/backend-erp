import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '@shared/presentation/decorators/current-user.decorator';
import { TenantsService } from '../../application/services/tenants.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants' })
  @Permissions('tenants', 'read')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tenantsService.findAll(page, limit);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current tenant' })
  @Permissions('tenants', 'read')
  getMyTenant(@CurrentUser() user: AuthenticatedUser) {
    return this.tenantsService.findMine(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @Permissions('tenants', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  @Permissions('tenants', 'create')
  create(
    @Body()
    data: {
      name: string;
      slug: string;
      cnpj?: string;
      email?: string;
      phone?: string;
      plan?: string;
      status?: string;
      logoUrl?: string;
      settings?: object;
    },
  ) {
    return this.tenantsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant settings' })
  @Permissions('tenants', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; email?: string; phone?: string; settings?: object },
  ) {
    return this.tenantsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete tenant' })
  @Permissions('tenants', 'delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
