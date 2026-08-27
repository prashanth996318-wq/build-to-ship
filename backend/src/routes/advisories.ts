import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { AdvisoryRequestSchema } from '../validators/advisory';
import { generateCropAdvisory } from '../services/geminiService';
import {
  createAdvisoryRecord,
  updateAdvisoryWithResult,
  markAdvisoryFailed,
  getUserAdvisories,
  getAdvisoryById,
  deleteAdvisory,
} from '../services/supabaseService';

/**
 * Advisory routes factory.
 * Accepts the AI-specific rate limiter as a parameter so it applies only to POST.
 */
export function advisoryRouter(aiRateLimiter: RequestHandler): Router {
  const router = Router();

  // All advisory routes require authentication
  router.use(authMiddleware);

  // -------------------------------------------------------------------------
  // POST /api/advisories
  // Create a new advisory request and generate AI recommendations.
  // -------------------------------------------------------------------------
  router.post(
    '/',
    aiRateLimiter,
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const userId = req.user!.id;

      // --- 1. Validate request body ---
      const parseResult = AdvisoryRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const zodError = parseResult.error as ZodError;
        const firstError = zodError.errors[0];
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: firstError?.message ?? 'Invalid input. Please check your submission.',
            details: zodError.flatten().fieldErrors,
          },
        });
        return;
      }

      const advisoryData = parseResult.data;

      // --- 2. Create pending advisory record ---
      let advisoryId: string;
      try {
        const record = await createAdvisoryRecord(userId, advisoryData);
        advisoryId = record.id;
      } catch (err) {
        next(err);
        return;
      }

      // --- 3. Generate AI advisory ---
      try {
        const { result, modelUsed } = await generateCropAdvisory(advisoryData);

        // --- 4. Persist the result ---
        await updateAdvisoryWithResult(advisoryId, userId, result, modelUsed);

        res.status(201).json({
          success: true,
          data: {
            id: advisoryId,
            status: 'completed',
            recommended_crop: result.primary_recommendation.crop,
            advisory_result: result,
            ai_model: modelUsed,
          },
        });
      } catch (aiError: unknown) {
        const message =
          aiError instanceof Error ? aiError.message : 'AI advisory generation failed.';

        // Mark the record as failed so the user can see it in history
        try {
          await markAdvisoryFailed(advisoryId, userId, 'AI_GENERATION_FAILED', message);
        } catch {
          // Best-effort — don't mask the original error
        }

        res.status(502).json({
          success: false,
          error: {
            code: 'AI_GENERATION_FAILED',
            message:
              'The AI advisory service encountered an error. Your request has been saved and you may retry.',
            advisory_id: advisoryId,
          },
        });
      }
    }
  );

  // -------------------------------------------------------------------------
  // GET /api/advisories
  // List all advisories for the authenticated user.
  // -------------------------------------------------------------------------
  router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;

    try {
      const advisories = await getUserAdvisories(userId);
      res.json({
        success: true,
        data: advisories,
      });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/advisories/:id
  // Get a single advisory (only if it belongs to the authenticated user).
  // -------------------------------------------------------------------------
  router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Validate id looks like a UUID to avoid unnecessary DB calls
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advisory not found.' },
      });
      return;
    }

    try {
      const advisory = await getAdvisoryById(id, userId);

      if (!advisory) {
        // Return 404 regardless of whether the record exists for another user
        // to avoid leaking information about other users' records
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Advisory not found.' },
        });
        return;
      }

      res.json({ success: true, data: advisory });
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // DELETE /api/advisories/:id
  // Delete an advisory (only if it belongs to the authenticated user).
  // -------------------------------------------------------------------------
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advisory not found.' },
      });
      return;
    }

    try {
      const deleted = await deleteAdvisory(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Advisory not found.' },
        });
        return;
      }

      res.json({
        success: true,
        data: { message: 'Advisory deleted successfully.' },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
