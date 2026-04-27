import { Module } from '@nestjs/common';
import { SettingsService } from './application/services/settings.service';
import { SettingsController } from './presentation/controllers/settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
