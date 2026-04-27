import { Module } from '@nestjs/common';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { UsersService } from './application/services/users.service';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [CreateUserUseCase, ListUsersUseCase, UsersService],
  exports: [CreateUserUseCase],
})
export class UsersModule {}
