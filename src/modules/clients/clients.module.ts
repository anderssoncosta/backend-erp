import { Module } from '@nestjs/common';
import { CreateClientUseCase } from './application/use-cases/create-client/create-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client/update-client.use-case';
import { ClientsController } from './presentation/controllers/clients.controller';

@Module({
  controllers: [ClientsController],
  providers: [CreateClientUseCase, UpdateClientUseCase],
  exports: [CreateClientUseCase],
})
export class ClientsModule {}