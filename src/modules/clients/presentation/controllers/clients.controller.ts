import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateClientUseCase } from '../../application/use-cases/create-client/create-client.use-case';
import { UpdateClientUseCase } from '../../application/use-cases/update-client/update-client.use-case';
import { CreateClientDto } from '../../application/use-cases/create-client/create-client.dto';
import { UpdateClientDto } from '../../application/use-cases/update-client/update-client.dto';
import { AddContactDto } from '../../application/use-cases/add-contact/add-contact.dto';
import { AddAddressDto } from '../../application/use-cases/add-address/add-address.dto';
import { ClientsService } from '../../application/services/clients.service';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly clientsService: ClientsService,
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
    return this.clientsService.list(tenantId, search, status, type, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @Permissions('clients', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.clientsService.findOne(id, tenantId);
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
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate client' })
  @Permissions('clients', 'update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client (soft)' })
  @Permissions('clients', 'delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contact to client' })
  @Permissions('clients', 'update')
  addContact(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddContactDto) {
    return this.clientsService.addContact(id, dto);
  }

  @Delete(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Remove contact from client' })
  @Permissions('clients', 'update')
  removeContact(@Param('contactId', ParseUUIDPipe) contactId: string) {
    return this.clientsService.removeContact(contactId);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Add address to client' })
  @Permissions('clients', 'update')
  addAddress(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddAddressDto) {
    return this.clientsService.addAddress(id, dto);
  }

  @Delete(':id/addresses/:addressId')
  @ApiOperation({ summary: 'Remove address from client' })
  @Permissions('clients', 'update')
  removeAddress(@Param('addressId', ParseUUIDPipe) addressId: string) {
    return this.clientsService.removeAddress(addressId);
  }
}
