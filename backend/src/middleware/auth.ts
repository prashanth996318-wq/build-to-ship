import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware.
 *
 * Expects: Authorization: Bearer <supabase-access-token>
 *
 * Validates the token with Supabase Auth, attaches the verified user to
 * req.user. Never trusts a client-supplied user_id.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      },
    });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const env = getEnv();

    // Use the anon client to validate the user's token.
    // We only need to verify the token is valid and get the user identity.
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired session. Please log in again.',
        },
      });
      return;
    }

    // Attach verified user identity to the request
    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication service unavailable. Please try again.',
      },
    });
  }
}
