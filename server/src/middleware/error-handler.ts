import type { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Central error handler with structured JSON logging.
 *
 * - Logs timestamp, requestId, HTTP method, path, status code, and message.
 * - In non-production environments the stack trace is included in the log
 *   AND in the response body for easier debugging.
 * - In production, stack traces are never leaked to the client.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const requestId = req.headers['x-request-id'] as string | undefined;
  const isProduction = process.env.NODE_ENV === 'production';

  // Structured log entry
  const logEntry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level: 'error',
    requestId: requestId || 'N/A',
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: err.name,
    message: err.message,
  };

  if (!isProduction) {
    logEntry.stack = err.stack;
  }

  console.error(JSON.stringify(logEntry));

  // Build client-facing response
  const responseBody: Record<string, unknown> = {
    error: err instanceof ApiError ? err.message : 'Internal server error',
  };

  if (requestId) {
    responseBody.requestId = requestId;
  }

  // Include stack trace for non-production environments to aid debugging
  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
}

export function notFound(entity: string, id: string): never {
  throw new ApiError(`${entity} '${id}' not found`, 404);
}
