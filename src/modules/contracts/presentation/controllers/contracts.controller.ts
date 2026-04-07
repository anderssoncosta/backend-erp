import { Body, Controller, Delete, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateContractUseCase } from '../../application/use-cases/create-contract/create-contract.use-case';
import { CreateContractDto } from '../../application/use-cases/create-contract/create-contract.dto';
import { UpdateContractDto } from '../../application/use-cases/update-contract/update-contract.dto';
import { AddServiceTypeDto } from '../../application/use-cases/add-service-type/add-service-type.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'contracts', version: '1' })
export class ContractsController {
  constructor(
    private readonly createContractUseCase: CreateContractUseCase,
    private readonly prisma: PrismaService,
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
    const expiryFilter = expiringDays ? { endDate: { lte: new Date(Date.now() + expiringDays * 86400000) } } : {};
    return this.prisma.contract.findMany({
      where: { tenantId, deletedAt: null, ...(clientId && { clientId }), ...(status && { status }), ...(type && { type }), ...expiryFilter },
      include: { client: { select: { id: true, name: true } }, serviceTypes: true, _count: { select: { serviceOrders: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @Permissions('contracts', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.contract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { client: true, serviceTypes: true, serviceOrders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contract' })
  @Permissions('contracts', 'update')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContractDto, @CurrentTenant() tenantId: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.contract.update({ where: { id }, data: { ...dto, endDate: dto.endDate ? new Date(dto.endDate) : undefined, slaPolicy: dto.slaPolicy as object } });
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate contract' })
  @Permissions('contracts', 'update')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend contract' })
  @Permissions('contracts', 'update')
  suspend(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'SUSPENDED', notes: body.reason } });
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel contract' })
  @Permissions('contracts', 'update')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'CANCELLED', notes: body.reason, deletedAt: new Date() } });
  }

  @Patch(':id/renew')
  @ApiOperation({ summary: 'Renew contract' })
  @Permissions('contracts', 'update')
  renew(@Param('id', ParseUUIDPipe) id: string, @Body() body: { endDate: string; notes?: string }) {
    return this.prisma.contract.update({ where: { id }, data: { endDate: new Date(body.endDate), status: 'ACTIVE', notes: body.notes } });
  }

  @Post(':id/service-types')
  @ApiOperation({ summary: 'Add service type to contract' })
  @Permissions('contracts', 'update')
  addServiceType(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddServiceTypeDto) {
    return this.prisma.contractServiceType.create({ data: { ...dto, contractId: id } });
  }

  @Delete(':id/service-types/:stId')
  @ApiOperation({ summary: 'Remove service type from contract' })
  @Permissions('contracts', 'update')
  removeServiceType(@Param('stId', ParseUUIDPipe) stId: string) {
    return this.prisma.contractServiceType.delete({ where: { id: stId } });
  }
}