import { Module } from '@nestjs/common';
import { CreateClientUseCase } from './application/use-cases/create-client/create-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client/update-client.use-case';
import { ClientsService } from './application/services/clients.service';
import { ClientsController } from './presentation/controllers/clients.controller';

@Module({
  controllers: [ClientsController],
  providers: [CreateClientUseCase, UpdateClientUseCase, ClientsService],
  exports: [CreateClientUseCase],
})
export class ClientsModule {}