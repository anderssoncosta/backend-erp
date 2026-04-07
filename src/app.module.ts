import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { CacheModule } from '@infrastructure/cache/cache.module';
import { BullMQModule } from '@infrastructure/queue/bullmq.module';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { LoggingModule } from '@infrastructure/logging/logging.module';
import { MailModule } from '@infrastructure/mail/mail.module';

// Core Modules
import { AuthModule } from '@modules/auth/auth.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { UsersModule } from '@modules/users/users.module';

// Business Modules
import { ServiceOrdersModule } from '@modules/service-orders/service-orders.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { FinancialModule } from '@modules/financial/financial.module';

// Stub Modules
import { FieldExecutionModule } from '@modules/field-execution/field-execution.module';
import { MaterialsModule } from '@modules/materials/materials.module';
import { FleetModule } from '@modules/fleet/fleet.module';
import { VehicleTrackingModule } from '@modules/vehicle-tracking/vehicle-tracking.module';
import { SchedulingModule } from '@modules/scheduling/scheduling.module';
import { ProjectsModule } from '@modules/projects/projects.module';
import { AssetsModule } from '@modules/assets/assets.module';
import { HelpdeskModule } from '@modules/helpdesk/helpdesk.module';
import { CallCenterModule } from '@modules/call-center/call-center.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { HrModule } from '@modules/hr/hr.module';
import { TimeTrackingModule } from '@modules/time-tracking/time-tracking.module';
import { SafetyModule } from '@modules/safety/safety.module';
import { WorksModule } from '@modules/works/works.module';
import { PublicLightingModule } from '@modules/public-lighting/public-lighting.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { ClientsModule } from '@modules/clients/clients.module';
import { ContractsModule } from '@modules/contracts/contracts.module';

// Shared
import { CorrelationIdMiddleware } from '@shared/presentation/middlewares/correlation-id.middleware';
import configuration from './config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', maxListeners: 20 }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),

    // Infrastructure (global)
    PrismaModule,
    CacheModule,
    BullMQModule,
    StorageModule,
    LoggingModule,
    MailModule,

    // Core
    AuthModule,
    TenantsModule,
    UsersModule,

    // Business
    ServiceOrdersModule,
    InventoryModule,
    FinancialModule,

    // Stub modules
    FieldExecutionModule,
    MaterialsModule,
    FleetModule,
    VehicleTrackingModule,
    SchedulingModule,
    ProjectsModule,
    AssetsModule,
    HelpdeskModule,
    CallCenterModule,
    ReportsModule,
    HrModule,
    TimeTrackingModule,
    SafetyModule,
    WorksModule,
    PublicLightingModule,
    NotificationsModule,
    AuditModule,
    SettingsModule,
    ClientsModule,
    ContractsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
