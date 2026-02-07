import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };

  const mockExecutionContext = (
    authorizationHeader?: string,
  ): ExecutionContext => {
    const request = {
      headers: {
        authorization: authorizationHeader,
      },
      user: undefined as Record<string, unknown> | undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and attach user payload for a valid Bearer token', async () => {
      const payload = { sub: 1, username: 'testuser', role: 'user' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const context = mockExecutionContext('Bearer valid-jwt-token');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', {
        secret: 'test-jwt-secret',
      });

      // Verify user was attached to request
      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(payload);
    });

    it('should throw UnauthorizedException when no Authorization header is present', async () => {
      const context = mockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token não fornecido',
      );
    });

    it('should throw UnauthorizedException when Authorization header has no Bearer prefix', async () => {
      const context = mockExecutionContext('Basic some-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when Authorization header is empty', async () => {
      const context = mockExecutionContext('');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const context = mockExecutionContext('Bearer expired-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token inválido ou expirado',
      );
    });

    it('should use JWT_SECRET from ConfigService', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });

      const context = mockExecutionContext('Bearer any-token');
      await guard.canActivate(context);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
