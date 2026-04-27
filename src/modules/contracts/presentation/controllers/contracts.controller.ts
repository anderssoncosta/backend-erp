import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateContractUseCase } from '../../application/use-cases/create-contract/create-contract.use-case';
import { CreateContractDto } from '../../application/use-cases/create-contract/create-contract.dto';
import { UpdateContractDto } from '../../application/use-cases/update-contract/update-contract.dto';
import { AddServiceTypeDto } from '../../application/use-cases/add-service-type/add-service-type.dto';
import { ContractsService } from '../../application/services/contracts.service';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'contracts', version: '1' })
export class ContractsController {
  constructor(
    private readonly createContractUseCase: CreateContractUseCase,
    private readonly contractsService: ContractsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create contract' })
  @Permissions('contracts', 'create')
  create(@Body() dto: CreateContractDto, @CurrentTenant() tenantId: string) {
    return this.createContractUseCase.execute(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List contracts' })
  @Permissions('contracts', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('expiringDays') expiringDays?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.contractsService.list(tenantId, clientId, status, type, expiringDays, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @Permissions('contracts', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.contractsService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contract' })
  @Permissions('contracts', 'update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContractDto, @CurrentTenant() tenantId: string) {
    return this.contractsService.update(id, dto, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate contract' })
  @Permissions('contracts', 'update')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.activate(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend contract' })
  @Permissions('contracts', 'update')
  suspend(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.contractsService.suspend(id, body.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel contract' })
  @Permissions('contracts', 'update')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.contractsService.cancel(id, body.reason);
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew contract' })
  @Permissions('contracts', 'update')
  renew(@Param('id', ParseUUIDPipe) id: string, @Body() body: { endDate: string; notes?: string }) {
    return this.contractsService.renew(id, body.endDate, body.notes);
  }

  @Post(':id/service-types')
  @ApiOperation({ summary: 'Add service type to contract' })
  @Permissions('contracts', 'update')
  addServiceType(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddServiceTypeDto) {
    return this.contractsService.addServiceType(id, dto);
  }

  @Delete(':id/service-types/:stId')
  @ApiOperation({ summary: 'Remove service type from contract' })
  @Permissions('contracts', 'update')
  removeServiceType(@Param('stId', ParseUUIDPipe) stId: string) {
    return this.contractsService.removeServiceType(stId);
  }
}
