import { Module } from '@nestjs/common';
import { SettingsController } from './presentation/controllers/settings.controller';

@Module({
  controllers: [SettingsController],
  providers: [],
})
export class SettingsModule {}
