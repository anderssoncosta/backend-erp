import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { HrService } from '../../application/services/hr.service';

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'hr', version: '1' })
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ─── Positions ─────────────────────────────────────────────────────────────

  @Post('positions')
  @ApiOperation({ summary: 'Create position/role' })
  @Permissions('hr', 'create')
  createPosition(
    @Body() body: { name: string; description?: string; level?: string; cbo?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.hrService.createPosition(tenantId, body);
  }

  @Get('positions')
  @ApiOperation({ summary: 'List positions' })
  @Permissions('hr', 'read')
  listPositions(@CurrentTenant() tenantId: string) {
    return this.hrService.listPositions(tenantId);
  }

  // ─── Employees ─────────────────────────────────────────────────────────────

  @Post('employees')
  @ApiOperation({ summary: 'Register employee' })
  @Permissions('hr', 'create')
  createEmployee(
    @Body() body: {
      name: string; positionId?: string; branchId?: string; userId?: string;
      cpf?: string; admissionDate: string; salary?: number; phone?: string; email?: string;
    },
    @CurrentTenant() tenantId: string,
  ) {
    return this.hrService.createEmployee(tenantId, body);
  }

  @Get('employees')
  @ApiOperation({ summary: 'List employees' })
  @Permissions('hr', 'read')
  listEmployees(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('positionId') positionId?: string,
    @Query('branchId') branchId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.hrService.listEmployees(tenantId, status, positionId, branchId, page, limit);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @Permissions('hr', 'read')
  getEmployee(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.hrService.getEmployee(id, tenantId);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  @Permissions('hr', 'update')
  updateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { positionId?: string; salary?: number; status?: string; phone?: string; email?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.hrService.updateEmployee(id, tenantId, body);
  }

  @Patch('employees/:id/terminate')
  @ApiOperation({ summary: 'Terminate employee' })
  @Permissions('hr', 'update')
  terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { terminationDate: string; reason?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.hrService.terminate(id, tenantId, body.terminationDate, body.reason);
  }
}
