import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ServiceOrderCreatedEvent } from '../../domain/events/service-order-created.event';
import { ServiceOrderStatusChangedEvent } from '../../domain/events/service-order-status-changed.event';

@WebSocketGateway({
  namespace: '/service-orders',
  cors: { origin: '*' },
})
export class ServiceOrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ServiceOrdersGateway.name);

  handleConnection(client: Socket): void {
    const tenantId = client.handshake.auth?.tenantId as string;
    if (tenantId) {
      void client.join(`tenant:${tenantId}`);
      this.logger.debug(`Client ${client.id} joined tenant room: ${tenantId}`);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribeToOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    void client.join(`order:${data.orderId}`);
  }

  @OnEvent(ServiceOrderCreatedEvent.EVENT_TYPE)
  handleServiceOrderCreated(event: ServiceOrderCreatedEvent): void {
    this.server
      .to(`tenant:${event.tenantId}`)
      .emit('service_order:created', {
        id: event.aggregateId,
        ...event.payload,
      });
  }

  @OnEvent(ServiceOrderStatusChangedEvent.EVENT_TYPE)
  handleStatusChanged(event: ServiceOrderStatusChangedEvent): void {
    this.server
      .to(`tenant:${event.tenantId}`)
      .to(`order:${event.aggregateId}`)
      .emit('service_order:status_changed', {
        orderId: event.aggregateId,
        ...event.payload,
      });
  }
}
