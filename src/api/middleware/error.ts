// =========================================
// CronosAI Ops - Error Handler Middleware
// =========================================

import type { Request, Response, NextFunction } from 'express';
import { CapabilityError } from '../../shared/errors.js';
import { config } from '../../shared/config.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  console.error(`[ERROR] ${err.message}`, {
    name: err.name,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  // Handle CapabilityError
  if (err instanceof CapabilityError) {
    res.status(400).json({
      success: false,
      error: err.code,
      message: err.userMessage,
      recoverable: err.recoverable,
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Resource not found.',
  });
}
