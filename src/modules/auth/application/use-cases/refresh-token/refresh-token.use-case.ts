import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { RefreshTokenDto } from './refresh-token.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const incomingHash = createHash('sha256').update(dto.refreshToken).digest('hex');

    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: incomingHash, revokedAt: null },
    });

    if (!record) throw new UnauthorizedException('Invalid refresh token');
    if (new Date() > record.expiresAt) throw new UnauthorizedException('Refresh token expired');

    const user = await this.prisma.user.findFirst({
      where: { id: record.userId, deletedAt: null },
      select: {
        id: true, tenantId: true, branchId: true, role: true, status: true,
        tenant: { select: { status: true } },
        permissions: {
          where: { isRevoked: false },
          select: { permission: { select: { module: true, action: true } } },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE' || user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('User or tenant is inactive');
    }

    await this.authRepository.revokeRefreshToken(incomingHash);

    const expiresIn = this.config.get<number>('JWT_ACCESS_EXPIRES_IN', 900);
    const permissions = user.permissions.map((up) => ({
      module: up.permission.module, action: up.permission.action,
    }));

    const accessToken = this.jwtService.sign(
      { sub: user.id, tenantId: user.tenantId, branchId: user.branchId, role: user.role, permissions },
      { secret: this.config.get('JWT_SECRET'), expiresIn },
    );

    const rawRefresh = randomBytes(64).toString('hex');
    const newHash = createHash('sha256').update(rawRefresh).digest('hex');
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.authRepository.saveRefreshToken({
      userId: user.id, tenantId: user.tenantId, tokenHash: newHash, expiresAt: expires,
    });

    return { accessToken, refreshToken: rawRefresh, expiresIn };
  }
}
