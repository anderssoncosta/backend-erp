import { ConflictException } from '@nestjs/common';

export class DuplicateEntityException extends ConflictException {
  constructor(entity: string, field?: string) {
    super(
      field
        ? `${entity} with this ${field} already exists`
        : `${entity} already exists`,
    );
  }
}
