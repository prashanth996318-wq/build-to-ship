import { Router, Request, Response } from 'express';
import { getEnv } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response): void => {
  const env = getEnv();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'Agriculture Advisor API',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});
