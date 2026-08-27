import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler.
 * Maps errors to safe, consistent JSON responses.
 * Never leaks stack traces, SQL errors, or API keys.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const env = getEnv();
  const isDev = env.NODE_ENV === 'development';

  // Log the full error server-side for debugging
  console.error(`[${new Date().toISOString()}] Error on ${req.method} ${req.path}:`);
  console.error(err);

  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';

  // In development, include the error message for easier debugging.
  // In production, use a generic message to avoid leaking internals.
  const message =
    statusCode < 500
      ? (err.message ?? 'An error occurred.')
      : isDev
        ? (err.message ?? 'Internal server error.')
        : 'An internal error occurred. Please try again.';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

/**
 * Creates a typed application error with a status code and error code.
 */
export function createError(
  message: string,
  statusCode: number,
  code: string
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
