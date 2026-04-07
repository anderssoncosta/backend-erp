import { Module } from '@nestjs/common';
import { HelpdeskController } from './presentation/controllers/helpdesk.controller';

@Module({
  controllers: [HelpdeskController],
  providers: [],
})
export class HelpdeskModule {}
