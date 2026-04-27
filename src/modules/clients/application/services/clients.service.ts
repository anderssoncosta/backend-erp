import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { AddContactDto } from '../use-cases/add-contact/add-contact.dto';
import { AddAddressDto } from '../use-cases/add-address/add-address.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(
    tenantId: string,
    search?: string,
    status?: string,
    type?: string,
    page: number = 1,
    limit: number = 20,
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

  findOne(id: string, tenantId: string) {
    return this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { contacts: true, addresses: true, contracts: { where: { deletedAt: null } }, _count: { select: { serviceOrders: true } } },
    });
  }

  activate(id: string) {
    return this.prisma.client.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  deactivate(id: string) {
    return this.prisma.client.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  remove(id: string) {
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  addContact(clientId: string, dto: AddContactDto) {
    return this.prisma.clientContact.create({ data: { ...dto, clientId } });
  }

  removeContact(contactId: string) {
    return this.prisma.clientContact.delete({ where: { id: contactId } });
  }

  addAddress(clientId: string, dto: AddAddressDto) {
    return this.prisma.clientAddress.create({ data: { ...dto, clientId } });
  }

  removeAddress(addressId: string) {
    return this.prisma.clientAddress.delete({ where: { id: addressId } });
  }
}
