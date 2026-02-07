import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Global interceptor that logs every incoming request and its response time.
 *
 * Example output:
 *   [LoggingInterceptor] GET /api/v1/posts — 200 (12ms)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const elapsed = Date.now() - start;
        this.logger.log(
          `${method} ${url} — ${response.statusCode} (${elapsed}ms)`,
        );
      }),
    );
  }
}
