import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const mockRequest = {
    method: 'GET',
    url: '/api/v1/posts',
    headers: { 'x-request-id': 'test-req-123' },
  };
  const mockResponse = { statusCode: 200 };

  const mockExecutionContext: Partial<ExecutionContext> = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
  };

  const mockCallHandler: Partial<CallHandler> = {
    handle: jest.fn().mockReturnValue(of({ data: 'test' })),
  };

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should call next.handle() and return the observable', (done) => {
    interceptor
      .intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        next: (value) => {
          expect(value).toEqual({ data: 'test' });
        },
        complete: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
      });
  });

  it('should log the request id, method, url, status code and elapsed time', (done) => {
    const logSpy = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation();

    interceptor
      .intercept(
        mockExecutionContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(
              /\[test-req-123\] GET \/api\/v1\/posts — 200 \(\d+ms\)/,
            ),
          );
          logSpy.mockRestore();
          done();
        },
      });
  });

  it('should use dash when x-request-id header is missing', (done) => {
    const noIdRequest = {
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: {},
    };
    const noIdContext: Partial<ExecutionContext> = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(noIdRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    };

    const logSpy = jest
      .spyOn((interceptor as any).logger, 'log')
      .mockImplementation();

    interceptor
      .intercept(
        noIdContext as ExecutionContext,
        mockCallHandler as CallHandler,
      )
      .subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/\[-\] POST \/api\/v1\/auth\/login — 200/),
          );
          logSpy.mockRestore();
          done();
        },
      });
  });
});
