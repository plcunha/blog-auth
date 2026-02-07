import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(username: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      this.logger.warn(`Login attempt failed: user "${username}" not found`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Compare hashed password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(
        `Login attempt failed: invalid password for "${username}"`,
      );
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user.id, user.username, user.role);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      // Verify the user still exists and is active
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuário inválido ou desativado');
      }

      return this.generateTokens(user.id, user.username, user.role);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn('Refresh token validation failed');
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }

  private async generateTokens(
    userId: number,
    username: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, username, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ),
      }),
    ]);

    return { access_token, refresh_token };
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') + '-refresh'
    );
  }
}
