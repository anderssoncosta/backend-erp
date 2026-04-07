import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionDef } from '@shared/presentation/decorators/permissions.decorator';
import { AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';
import { ROLES } from '@shared/constants/rbac-roles.constant';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionDef>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) return false;

    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
      return true;
    }

    const hasPermission = user.permissions?.some(
      (p) => p.module === required.module && p.action === required.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing permission: ${required.module}:${required.action}`,
      );
    }

    return true;
  }
}
