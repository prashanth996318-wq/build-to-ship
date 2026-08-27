import { Request, Response } from 'express';

/**
 * Catch-all handler for routes not matched by any registered route.
 * Returns a clean 404 JSON response.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.path} does not exist.`,
    },
  });
}
