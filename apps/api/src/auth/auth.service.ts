import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '@common/automation';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  LogoutRequestSchema,
  ChangePasswordRequestSchema,
  ResetPasswordRequestSchema,
  ResetPasswordConfirmSchema,
  VerifyEmailRequestSchema,
  AuthCallbackSchema,
} from '@schemas/automation';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginRequestSchema): Promise<LoginResponseSchema> {
    const { email, password, provider, code, state } = loginDto;

    let user;
    if (provider && code) {
      // OAuth flow
      user = await this.handleOAuthLogin(provider, code, state);
    } else {
      // Local login
      user = await this.validateUser(email, password);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User ${user.email} logged in`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        orgId: user.orgId,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseSchema> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      };

      const accessToken = this.jwtService.sign(newPayload);

      return {
        accessToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<{ message: string }> {
    // In a real implementation, you would invalidate the refresh token
    // by storing it in a blacklist or updating the user's token version
    logger.info(`User ${userId} logged out`);
    return { message: 'Logout successful' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordRequestSchema
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // In a real implementation, you would verify the current password
    // and hash the new password before storing it

    logger.info(`User ${userId} changed password`);
    return { message: 'Password changed successfully' };
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // In a real implementation, you would generate a reset token
    // and send an email with the reset link

    logger.info(`Password reset requested for ${email}`);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPasswordConfirm(confirmDto: ResetPasswordConfirmSchema): Promise<{ message: string }> {
    const { token, newPassword } = confirmDto;

    // In a real implementation, you would verify the token
    // and update the user's password

    logger.info('Password reset confirmed');
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(verifyDto: VerifyEmailRequestSchema): Promise<{ message: string }> {
    const { token } = verifyDto;

    // In a real implementation, you would verify the token
    // and mark the user's email as verified

    logger.info('Email verification confirmed');
    return { message: 'Email verified successfully' };
  }

  async oauthCallback(callbackDto: AuthCallbackSchema): Promise<LoginResponseSchema> {
    const { provider, code, state } = callbackDto;

    // In a real implementation, you would exchange the code for tokens
    // and create or update the user

    throw new BadRequestException('OAuth callback not implemented');
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        org: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      org: user.org,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      avatar: user.avatar,
    };
  }

  private async validateUser(email: string, password?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // In a real implementation, you would verify the password
    // using bcrypt or similar

    return user;
  }

  private async handleOAuthLogin(provider: string, code: string, state?: string) {
    // In a real implementation, you would handle OAuth providers
    // like Google, Microsoft, etc.
    throw new BadRequestException('OAuth login not implemented');
  }
}