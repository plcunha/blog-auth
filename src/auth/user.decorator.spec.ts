import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './user.decorator';

/**
 * Helper that extracts the factory function used by a custom param decorator.
 * Based on NestJS testing patterns for custom decorators.
 */
function getParamDecoratorFactory(decorator: Function) {
  // Apply the decorator to a dummy class method parameter
  class TestController {
    public test(@decorator() _value: unknown) {}
  }

  // Extract the metadata that NestJS stores for param decorators
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  );

  // The metadata key format is `decoratorType:paramIndex`
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser Decorator', () => {
  const mockUser = {
    sub: 1,
    username: 'testuser',
    role: 'admin',
  };

  const mockExecutionContext = (
    user?: Record<string, unknown>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  let factory: (data: string | undefined, ctx: ExecutionContext) => unknown;

  beforeEach(() => {
    factory = getParamDecoratorFactory(CurrentUser);
  });

  it('should return the full user object when no data argument is passed', () => {
    const ctx = mockExecutionContext(mockUser);
    const result = factory(undefined, ctx);

    expect(result).toEqual(mockUser);
  });

  it('should return a specific property when data argument is passed', () => {
    const ctx = mockExecutionContext(mockUser);

    expect(factory('username', ctx)).toBe('testuser');
    expect(factory('role', ctx)).toBe('admin');
    expect(factory('sub', ctx)).toBe(1);
  });

  it('should return undefined for a non-existent property', () => {
    const ctx = mockExecutionContext(mockUser);
    const result = factory('nonexistent', ctx);

    expect(result).toBeUndefined();
  });

  it('should return undefined when user is not set on request', () => {
    const ctx = mockExecutionContext(undefined);
    const result = factory(undefined, ctx);

    expect(result).toBeUndefined();
  });

  it('should return undefined when accessing a property on undefined user', () => {
    const ctx = mockExecutionContext(undefined);
    const result = factory('username', ctx);

    expect(result).toBeUndefined();
  });
});
