import { UnprocessableEntityException } from '@nestjs/common';

export class BusinessRuleException extends UnprocessableEntityException {
  constructor(message: string, public readonly rule?: string) {
    super({ message, rule, error: 'BUSINESS_RULE_VIOLATION' });
  }
}
