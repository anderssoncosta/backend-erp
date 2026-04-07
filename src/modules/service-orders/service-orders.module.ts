import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '@shared/constants/queue-names.constant';
import { SERVICE_ORDER_REPOSITORY } from './domain/repositories/service-order.repository.interface';
import { ServiceOrderPrismaRepository } from './infrastructure/repositories/service-order.prisma.repository';
import { SlaCalculatorService } from './domain/services/sla-calculator.service';
import { CreateServiceOrderUseCase } from './application/use-cases/create-service-order/create-service-order.use-case';
import { UpdateServiceOrderUseCase } from './application/use-cases/update-service-order/update-service-order.use-case';
import { AssignServiceOrderUseCase } from './application/use-cases/assign-service-order/assign-service-order.use-case';
import { ChangeStatusUseCase } from './application/use-cases/change-status/change-status.use-case';
import { CancelServiceOrderUseCase } from './application/use-cases/cancel-service-order/cancel-service-order.use-case';
import { ReopenServiceOrderUseCase } from './application/use-cases/reopen-service-order/reopen-service-order.use-case';
import { ListServiceOrdersUseCase } from './application/use-cases/list-service-orders/list-service-orders.use-case';
import { GetServiceOrderUseCase } from './application/use-cases/get-service-order/get-service-order.use-case';
import { AddCommentUseCase } from './application/use-cases/add-comment/add-comment.use-case';
import { OnServiceOrderCreatedHandler } from './application/event-handlers/on-service-order-created.handler';
import { OnServiceOrderStatusChangedHandler } from './application/event-handlers/on-service-order-status-changed.handler';
import { SlaMonitorProcessor } from './infrastructure/jobs/sla-monitor.processor';
import { ServiceOrdersController } from './presentation/controllers/service-orders.controller';
import { ServiceOrdersGateway } from './presentation/gateways/service-orders.gateway';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.SERVICE_ORDERS },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.AUDIT },
    ),
  ],
  controllers: [ServiceOrdersController],
  providers: [
    { provide: SERVICE_ORDER_REPOSITORY, useClass: ServiceOrderPrismaRepository },
    SlaCalculatorService,
    CreateServiceOrderUseCase,
    UpdateServiceOrderUseCase,
    AssignServiceOrderUseCase,
    ChangeStatusUseCase,
    CancelServiceOrderUseCase,
    ReopenServiceOrderUseCase,
    ListServiceOrdersUseCase,
    GetServiceOrderUseCase,
    AddCommentUseCase,
    OnServiceOrderCreatedHandler,
    OnServiceOrderStatusChangedHandler,
    SlaMonitorProcessor,
    ServiceOrdersGateway,
  ],
  exports: [GetServiceOrderUseCase, SERVICE_ORDER_REPOSITORY],
})
export class ServiceOrdersModule {}
