import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  const mockRequest = { method: 'GET', url: '/api/v1/posts' };
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

  it('should log the request method, url, status code and elapsed time', (done) => {
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
            expect.stringMatching(/GET \/api\/v1\/posts — 200 \(\d+ms\)/),
          );
          logSpy.mockRestore();
          done();
        },
      });
  });
});
