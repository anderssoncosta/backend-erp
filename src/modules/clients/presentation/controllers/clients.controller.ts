import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { CreateClientUseCase } from '../../application/use-cases/create-client/create-client.use-case';
import { UpdateClientUseCase } from '../../application/use-cases/update-client/update-client.use-case';
import { CreateClientDto } from '../../application/use-cases/create-client/create-client.dto';
import { UpdateClientDto } from '../../application/use-cases/update-client/update-client.dto';
import { AddContactDto } from '../../application/use-cases/add-contact/add-contact.dto';
import { AddAddressDto } from '../../application/use-cases/add-address/add-address.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create client' })
  @Permissions('clients', 'create')
  create(@Body() dto: CreateClientDto, @CurrentTenant() tenantId: string) {
    return this.createClientUseCase.execute(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List clients' })
  @Permissions('clients', 'read')
  list(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.prisma.client.findMany({
      where: {
        tenantId, deletedAt: null,
        ...(status && { status }),
        ...(type && { type }),
        ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { document: { contains: search } }, { email: { contains: search, mode: 'insensitive' } }] }),
      },
      include: { contacts: { where: { isPrimary: true } }, _count: { select: { contracts: true, serviceOrders: true } } },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit, take: limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @Permissions('clients', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { contacts: true, addresses: true, contracts: { where: { deletedAt: null } }, _count: { select: { serviceOrders: true } } },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @Permissions('clients', 'update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto, @CurrentTenant() tenantId: string) {
    return this.updateClientUseCase.execute(id, dto, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate client' })
  @Permissions('clients', 'update')
  activate(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.client.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate client' })
  @Permissions('clients', 'update')
  deactivate(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.client.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client (soft)' })
  @Permissions('clients', 'delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contact to client' })
  @Permissions('clients', 'update')
  addContact(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddContactDto, @CurrentTenant() tenantId: string) {
    return this.prisma.clientContact.create({ data: { ...dto, clientId: id } });
  }

  @Delete(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Remove contact from client' })
  @Permissions('clients', 'update')
  removeContact(@Param('contactId', ParseUUIDPipe) contactId: string) {
    return this.prisma.clientContact.delete({ where: { id: contactId } });
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add address to client' })
  @Permissions('clients', 'update')
  addAddress(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddAddressDto) {
    return this.prisma.clientAddress.create({ data: { ...dto, clientId: id } });
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Remove address from client' })
  @Permissions('clients', 'update')
  removeAddress(@Param('addressId', ParseUUIDPipe) addressId: string) {
    return this.prisma.clientAddress.delete({ where: { id: addressId } });
  }
}