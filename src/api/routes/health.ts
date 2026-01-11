// =========================================
// CronosAI Ops - Health Check Route
// =========================================

import { Router, Request, Response } from 'express';
import { testClaudeConnection } from '../../core/ai/claude.js';
import type { HealthResponse } from '../../shared/types.js';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  let claudeStatus = false;

  try {
    claudeStatus = await testClaudeConnection();
  } catch {
    claudeStatus = false;
  }

  const response: HealthResponse = {
    status: claudeStatus ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      claude: claudeStatus,
    },
  };

  const statusCode = response.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(response);
});

export { router as healthRouter };
