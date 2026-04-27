import { Module } from '@nestjs/common';
import { HelpdeskService } from './application/services/helpdesk.service';
import { HelpdeskController } from './presentation/controllers/helpdesk.controller';

@Module({
  controllers: [HelpdeskController],
  providers: [HelpdeskService],
})
export class HelpdeskModule {}
