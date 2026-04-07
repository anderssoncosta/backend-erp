import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { LoginDto } from './login.dto';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email: string; role: string; tenantId: string };
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      select: {
        id: true, tenantId: true, branchId: true, name: true,
        email: true, password: true, role: true, status: true,
        tenant: { select: { status: true } },
        permissions: {
          where: { isRevoked: false },
          select: { permission: { select: { module: true, action: true } } },
        },
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is inactive');
    if (user.tenant.status !== 'ACTIVE') throw new UnauthorizedException('Tenant is inactive');

    const expiresIn = this.config.get<number>('JWT_ACCESS_EXPIRES_IN', 900);
    const permissions = user.permissions.map((up) => ({
      module: up.permission.module, action: up.permission.action,
    }));

    const accessToken = this.jwtService.sign(
      { sub: user.id, tenantId: user.tenantId, branchId: user.branchId, role: user.role, permissions },
      { secret: this.config.get('JWT_SECRET'), expiresIn },
    );

    const rawRefresh = randomBytes(64).toString('hex');
    const refreshHash = createHash('sha256').update(rawRefresh).digest('hex');
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);

    await this.authRepository.saveRefreshToken({
      userId: user.id, tenantId: user.tenantId,
      tokenHash: refreshHash, expiresAt: refreshExpires,
    });

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    this.logger.log(`User ${user.email} logged in`);
    return {
      accessToken, refreshToken: rawRefresh, expiresIn,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    };
  }
}
