import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../domain/repositories/auth.repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.authRepository.revokeRefreshToken(hash);
  }
}
