import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const mockExecutionContext = (
    user?: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no @Roles() decorator is present (no required roles)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = mockExecutionContext({ role: 'user' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when @Roles() is present with empty array', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const context = mockExecutionContext({ role: 'user' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has a matching role', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = mockExecutionContext({ role: 'admin' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of several required roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'moderator']);

      const context = mockExecutionContext({ role: 'moderator' });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role does not match', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = mockExecutionContext({ role: 'user' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Acesso negado: permissões insuficientes',
      );
    });

    it('should throw ForbiddenException when user object is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = mockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no role property', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);

      const context = mockExecutionContext({ username: 'testuser' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
