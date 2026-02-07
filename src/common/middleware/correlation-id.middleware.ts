import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware that ensures every request has a unique correlation ID.
 *
 * - If the client sends an `X-Request-Id` header, it's preserved.
 * - Otherwise a new UUID v4 is generated.
 * - The ID is always echoed back in the response headers.
 *
 * Usage in logs: correlate all log entries for a single request.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-request-id'] as string) || randomUUID();

    // Store on request so downstream handlers/interceptors can access it
    req.headers['x-request-id'] = correlationId;

    // Echo back to the client
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}
