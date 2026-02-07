import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter that normalises every HTTP error into a
 * consistent JSON shape:
 *
 * {
 *   statusCode: 404,
 *   message: 'Resource not found',
 *   error: 'Not Found',
 *   path: '/api/v1/users/999',
 *   timestamp: '2026-02-06T12:00:00.000Z'
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // NestJS validation pipe returns { message: string[], error, statusCode }
    const message =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>).message ||
          (exceptionResponse as Record<string, unknown>).error ||
          'Internal server error'
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'Internal server error';

    const errorName =
      exception instanceof HttpException
        ? ((exceptionResponse as Record<string, unknown>)?.error as string) ||
          exception.name
        : 'Internal Server Error';

    const body = {
      statusCode: status,
      message,
      error: errorName,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Log 5xx errors as errors, 4xx as warnings
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status}`);
    }

    response.status(status).json(body);
  }
}
