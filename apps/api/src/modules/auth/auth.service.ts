import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
} from '../../common/utils/encryption.util';
import { UserStatus } from '@prisma/client';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, mfaSecret: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${remaining} minutes.`);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const update: any = { failedLoginAttempts: attempts };

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        update.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        update.failedLoginAttempts = 0;
        this.logger.warn(`Account locked: ${email} (${MAX_FAILED_ATTEMPTS} failed attempts)`);
      }

      await this.prisma.user.update({ where: { id: user.id }, data: update });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Check if MFA is required
    if (user.mfaEnabled && user.mfaSecret?.isEnabled) {
      const mfaToken = generateSecureToken();
      // Store in Redis for 5 minutes
      await this.redis.set(`mfa-login:${mfaToken}`, user.id, 300);
      return { mfaRequired: true, mfaToken, user: null, accessToken: null, refreshToken: null };
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, mfaRequired: false, mfaToken: null };
  }

  async verifyMfaLogin(mfaToken: string, code: string) {
    const userId = await this.redis.get(`mfa-login:${mfaToken}`);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, mfaSecret: true },
    });

    if (!user || !user.mfaSecret || !user.mfaSecret.isEnabled) {
      throw new UnauthorizedException('MFA not configured or enabled for this user');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.mfaSecret.secret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Clear the temp token
    await this.redis.del(`mfa-login:${mfaToken}`);

    return this.issueTokens(user);
  }

  async issueTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      hospitalId: user.hospitalId,
      role: user.role?.name,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshTokenValue = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenValue,
        expiresAt,
        createdBy: user.id,
        updatedBy: user.id,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue, user };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, updatedBy: stored.userId },
    });

    return this.issueTokens(stored.user);
  }

  async logout(userId: string, accessToken: string, refreshToken?: string) {
    // Blacklist current access token in Redis (TTL = remaining JWT lifetime ~15min)
    if (accessToken) {
      await this.redis.set(`revoked:${accessToken}`, '1', 900);
    }

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true, updatedBy: userId },
      });
    }
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
  }

  // ── Password Reset ──────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return true to prevent email enumeration
      return true;
    }

    const token = generateSecureToken();
    // Reset token valid for 15 minutes
    await this.redis.set(`reset:${token}`, user.id, 900);

    this.logger.log(`[PASSWORD RESET] Token generated for ${email}: ${token}`);
    // In production, send email here. In dev we log it.
    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const userId = await this.redis.get(`reset:${token}`);
    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`reset:${token}`);
    return true;
  }

  // ── MFA/TOTP ─────────────────────────────────────────────────────────────

  async generateMfaSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mfaSecret: true },
    });

    if (!user) throw new BadRequestException('User not found');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Aurevix HMS', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Save/Upsert temporary secret (isEnabled: false)
    await this.prisma.mfaSecret.upsert({
      where: { userId },
      update: { secret, isEnabled: false, updatedBy: userId },
      create: { userId, secret, isEnabled: false, createdBy: userId, updatedBy: userId },
    });

    return { secret, qrCodeUrl };
  }

  async enableMfa(userId: string, token: string): Promise<boolean> {
    const mfaSecret = await this.prisma.mfaSecret.findUnique({ where: { userId } });
    if (!mfaSecret) throw new BadRequestException('Mfa secret not generated');

    const isValid = authenticator.verify({
      token,
      secret: mfaSecret.secret,
    });

    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.prisma.$transaction(async (tx) => {
      await tx.mfaSecret.update({
        where: { userId },
        data: { isEnabled: true, updatedBy: userId },
      });
      await tx.user.update({
        where: { id: userId },
        data: { mfaEnabled: true, updatedAt: new Date(), updatedBy: userId },
      });
    });

    return true;
  }

  async disableMfa(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { mfaSecret: true },
    });

    if (!user || !user.mfaSecret || !user.mfaSecret.isEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret.secret,
    });

    if (!isValid) throw new BadRequestException('Invalid verification code');

    await this.prisma.$transaction(async (tx) => {
      await tx.mfaSecret.delete({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: { mfaEnabled: false, updatedAt: new Date(), updatedBy: userId },
      });
    });

    return true;
  }

  async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }
}
