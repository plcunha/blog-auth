import { CorrelationIdMiddleware } from './correlation-id.middleware';
import { Request, Response } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  const mockNext = jest.fn();

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockNext.mockClear();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should generate a UUID when no X-Request-Id header is present', () => {
    const req = { headers: {} } as Request;
    const setHeaderMock = jest.fn();
    const res = { setHeader: setHeaderMock } as unknown as Response;

    middleware.use(req, res, mockNext);

    // Should set a UUID on the request header
    expect(req.headers['x-request-id']).toBeDefined();
    expect(typeof req.headers['x-request-id']).toBe('string');
    expect((req.headers['x-request-id'] as string).length).toBeGreaterThan(0);

    // Should echo it back in the response
    expect(setHeaderMock).toHaveBeenCalledWith(
      'X-Request-Id',
      req.headers['x-request-id'],
    );

    expect(mockNext).toHaveBeenCalled();
  });

  it('should preserve an existing X-Request-Id from the client', () => {
    const existingId = 'client-provided-id-abc';
    const req = {
      headers: { 'x-request-id': existingId },
    } as unknown as Request;
    const setHeaderMock = jest.fn();
    const res = { setHeader: setHeaderMock } as unknown as Response;

    middleware.use(req, res, mockNext);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(setHeaderMock).toHaveBeenCalledWith('X-Request-Id', existingId);
    expect(mockNext).toHaveBeenCalled();
  });
});
