import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ResetPasswordDto } from './reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.authRepository.findPasswordResetToken(dto.token);
    if (!record) throw new NotFoundException('Invalid or expired token');
    if (record.usedAt) throw new BadRequestException('Token already used');
    if (new Date() > record.expiresAt) throw new BadRequestException('Token has expired');

    const hash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { password: hash, updatedAt: new Date() },
    });

    await this.authRepository.markPasswordResetTokenUsed(record.id);
    await this.authRepository.revokeAllUserTokens(record.userId);

    return { message: 'Password reset successfully' };
  }
}
