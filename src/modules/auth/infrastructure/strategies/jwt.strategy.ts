import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { AuthenticatedUser } from '@shared/presentation/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  tenantId: string;
  branchId?: string;
  role: string;
  permissions?: Array<{ module: string; action: string }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, deletedAt: null },
      select: {
        id: true, tenantId: true, branchId: true, role: true, status: true,
        tenant: { select: { status: true } },
        permissions: {
          where: { isRevoked: false },
          select: { permission: { select: { module: true, action: true } } },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('User inactive');
    if (user.tenant.status !== 'ACTIVE') throw new UnauthorizedException('Tenant inactive');

    return {
      id: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId ?? undefined,
      role: user.role,
      permissions: user.permissions.map((up) => ({
        module: up.permission.module,
        action: up.permission.action,
      })),
    };
  }
}
