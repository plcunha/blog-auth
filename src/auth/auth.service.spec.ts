import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let configService: Partial<Record<keyof ConfigService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return map[key] || fallback;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access_token and refresh_token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      usersService.findByUsername!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      });

      const result = await authService.signIn('testuser', 'correct-password');

      expect(result).toEqual({
        access_token: 'signed-jwt-token',
        refresh_token: 'signed-jwt-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByUsername!.mockResolvedValue(null);

      await expect(
        authService.signIn('nonexistent', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      usersService.findByUsername!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      });

      await expect(
        authService.signIn('testuser', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens for a valid refresh token', async () => {
      jwtService.verifyAsync!.mockResolvedValue({
        sub: 1,
        username: 'testuser',
        role: 'user',
      });

      usersService.findById!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        role: 'user',
        isActive: true,
      });

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(result).toEqual({
        access_token: 'signed-jwt-token',
        refresh_token: 'signed-jwt-token',
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'test-refresh-secret' },
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      jwtService.verifyAsync!.mockRejectedValue(new Error('Invalid token'));

      await expect(authService.refreshTokens('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      jwtService.verifyAsync!.mockResolvedValue({
        sub: 1,
        username: 'testuser',
        role: 'user',
      });

      usersService.findById!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        role: 'user',
        isActive: false,
      });

      await expect(
        authService.refreshTokens('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      jwtService.verifyAsync!.mockResolvedValue({
        sub: 999,
        username: 'deleted',
        role: 'user',
      });

      usersService.findById!.mockResolvedValue(null);

      await expect(
        authService.refreshTokens('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getRefreshSecret (fallback)', () => {
    it('should fall back to JWT_SECRET + "-refresh" when JWT_REFRESH_SECRET is not set', async () => {
      // Override configService to return undefined for JWT_REFRESH_SECRET
      configService.get!.mockImplementation(
        (key: string, fallback?: string) => {
          const map: Record<string, string> = {
            JWT_SECRET: 'my-secret',
            JWT_REFRESH_EXPIRATION: '7d',
          };
          return map[key] || fallback;
        },
      );

      const hashedPassword = await bcrypt.hash('password', 10);
      usersService.findByUsername!.mockResolvedValue({
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'user',
      });

      // signIn internally calls generateTokens → getRefreshSecret
      await authService.signIn('testuser', 'password');

      // The refresh token signAsync call should use the fallback secret
      const refreshSignCall = jwtService.signAsync!.mock.calls[1];
      expect(refreshSignCall[1]).toEqual(
        expect.objectContaining({
          secret: 'my-secret-refresh',
        }),
      );
    });
  });
});
