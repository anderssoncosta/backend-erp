import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from '@shared/presentation/guards/permissions.guard';
import { Permissions } from '@shared/presentation/decorators/permissions.decorator';
import { CurrentTenant } from '@shared/presentation/decorators/current-tenant.decorator';
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users/list-users.use-case';
import { CreateUserDto } from '../../application/use-cases/create-user/create-user.dto';
import { ListUsersQueryDto } from '../../application/use-cases/list-users/list-users.query.dto';
import { UpdateUserDto } from '../../application/use-cases/update-user/update-user.dto';
import { UsersService } from '../../application/services/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly createUC: CreateUserUseCase,
    private readonly listUC: ListUsersUseCase,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @Permissions('users', 'create')
  create(@Body() dto: CreateUserDto, @CurrentTenant() tenantId: string) {
    return this.createUC.execute(dto, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @Permissions('users', 'read')
  findAll(@Query() query: ListUsersQueryDto, @CurrentTenant() tenantId: string) {
    return this.listUC.execute(query, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @Permissions('users', 'read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @Permissions('users', 'update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  @Permissions('users', 'delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'List user permissions' })
  @Permissions('users', 'read')
  getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPermissions(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to user' })
  @Permissions('users', 'update')
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { permissionIds: string[]; grantedById: string },
  ) {
    return this.usersService.assignPermissions(id, body.permissionIds, body.grantedById);
  }
}
