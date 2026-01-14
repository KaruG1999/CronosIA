// =========================================
// CronosAI Ops - Capabilities Routes
// =========================================

import { Router, Request, Response, NextFunction } from 'express';
import { executeCapability, getAvailableCapabilities } from '../../core/orchestrator.js';
import { hasCapability } from '../../core/capabilities/index.js';
import { CapabilityError, createError, Errors } from '../../shared/errors.js';

const router = Router();

/**
 * GET /capability
 * List all available capabilities with their prices
 */
router.get('/', (_req: Request, res: Response) => {
  const capabilities = getAvailableCapabilities();

  res.json({
    success: true,
    capabilities: capabilities.map(cap => ({
      slug: cap.slug,
      name: cap.name,
      description: cap.description,
      price: cap.price,
      limitations: cap.limitations,
    })),
  });
});

/**
 * POST /capability/:slug
 * Execute a specific capability
 *
 * Note: In production, x402 middleware will be applied here
 * to require payment before execution
 */
router.post(
  '/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slugParam = req.params['slug'];
      const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

      // Validate slug exists
      if (!slug || !hasCapability(slug)) {
        throw createError(Errors.CAPABILITY_NOT_FOUND, `Capability '${slug}' not found`);
      }

      // Execute capability
      const result = await executeCapability(slug, req.body);

      // Return response
      res.json({
        success: true,
        capability: result.capability,
        cost: result.cost,
        result: result.rawResult.data,
        response: result.formattedResponse,
        warnings: result.rawResult.warnings,
        limitations: result.rawResult.limitations,
        processingTimeMs: result.processingTimeMs,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Handle capability-specific errors
 */
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CapabilityError) {
    const statusCode = err.code === 'CAPABILITY_NOT_FOUND' ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      error: err.code,
      message: err.userMessage,
      recoverable: err.recoverable,
    });
    return;
  }

  next(err);
});

export { router as capabilitiesRouter };
