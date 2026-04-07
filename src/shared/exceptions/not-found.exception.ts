import { NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id "${id}" not found` : `${entity} not found`);
  }
}
