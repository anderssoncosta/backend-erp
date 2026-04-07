import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledJobsService } from './scheduled-jobs.service';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          attempts: config.get<number>('QUEUE_ATTEMPTS', 3),
          backoff: {
            type: config.get('QUEUE_BACKOFF_TYPE', 'exponential'),
            delay: config.get<number>('QUEUE_BACKOFF_DELAY', 2000),
          },
          removeOnComplete: { count: 1000, age: 86400 },
          removeOnFail: { count: 5000 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.SERVICE_ORDERS },
      { name: QUEUE_NAMES.INVENTORY },
      { name: QUEUE_NAMES.FINANCIAL },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.AUDIT },
      { name: QUEUE_NAMES.REPORTS },
      { name: QUEUE_NAMES.MAIL },
      { name: QUEUE_NAMES.PUSH },
      { name: QUEUE_NAMES.SYNC },
    ),
  ],
  providers: [ScheduledJobsService],
  exports: [BullModule],
})
export class BullMQModule {}
