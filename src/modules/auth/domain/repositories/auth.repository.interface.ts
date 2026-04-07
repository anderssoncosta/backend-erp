export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface IAuthRepository {
  findRefreshToken(
    tokenHash: string,
    userId: string,
  ): Promise<{ id: string; expiresAt: Date; revokedAt: Date | null } | null>;
  saveRefreshToken(data: {
    userId: string;
    tenantId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  savePasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<void>;
  findPasswordResetToken(token: string): Promise<{
    id: string;
    userId: string;
    expiresAt: Date;
    usedAt: Date | null;
  } | null>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
}
