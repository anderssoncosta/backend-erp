import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { MailService } from '@infrastructure/mail/mail.service';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { ForgotPasswordDto } from './forgot-password.dto';

const GENERIC_RESPONSE = {
  message: 'If an account with that email exists, a password reset link has been sent.',
};

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<typeof GENERIC_RESPONSE> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null, status: 'ACTIVE' },
      select: { id: true, name: true, email: true },
    });

    if (!user) return GENERIC_RESPONSE;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.authRepository.savePasswordResetToken({ userId: user.id, token, expiresAt });

    try {
      await this.mail.sendPasswordReset(user.email, token, user.name);
    } catch (err) {
      this.logger.error(`Failed to send reset email to ${user.email}`, err);
    }

    return GENERIC_RESPONSE;
  }
}
