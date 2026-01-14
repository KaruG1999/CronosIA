// =========================================
// CronosAI Ops - x402 Payment Middleware
// Uses @crypto.com/facilitator-client for Cronos x402
// =========================================

import type { Request, Response, NextFunction } from 'express';
import {
  Facilitator,
  CronosNetwork,
  Scheme,
  Contract,
  type PaymentRequirements,
  type VerifyRequest,
} from '@crypto.com/facilitator-client';
import { config } from '../../shared/config.js';
import { CAPABILITIES_META, type CapabilitySlug } from '../../core/capabilities/index.js';

// =========================================
// Types
// =========================================

interface PaymentLog {
  timestamp: string;
  capability: string;
  price: string;
  network: string;
  payerAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'verified' | 'settled' | 'failed';
}

interface X402PaymentInfo {
  x402Version: number;
  accepts: PaymentRequirements;
  error?: string;
}

// =========================================
// Facilitator Client
// =========================================

// Get the correct CronosNetwork enum based on config
const cronosNetwork = config.isMainnet
  ? CronosNetwork.CronosMainnet
  : CronosNetwork.CronosTestnet;

// Get the correct token contract based on network
const paymentAsset = config.isMainnet
  ? Contract.USDCe
  : Contract.DevUSDCe;

// Initialize facilitator client (lazy, created on first use)
let facilitator: Facilitator | null = null;

function getFacilitator(): Facilitator {
  if (!facilitator) {
    facilitator = new Facilitator({
      network: cronosNetwork,
    });
    console.log(`[x402] Facilitator initialized for ${config.networkId}`);
  }
  return facilitator;
}

// =========================================
// Payment Logging
// =========================================

const paymentLogs: PaymentLog[] = [];

function logPayment(log: PaymentLog): void {
  paymentLogs.push(log);

  const statusColors: Record<string, string> = {
    pending: '\x1b[33m',    // yellow
    verified: '\x1b[36m',   // cyan
    settled: '\x1b[32m',    // green
    failed: '\x1b[31m',     // red
  };

  const color = statusColors[log.status] ?? '\x1b[0m';
  const reset = '\x1b[0m';

  console.log(`[x402] ${color}${log.status.toUpperCase()}${reset}: ${log.capability} (${log.price})`);

  if (log.transactionHash) {
    console.log(`[x402]   TX: ${log.transactionHash}`);
  }
}

export function getPaymentLogs(limit = 100): PaymentLog[] {
  return paymentLogs.slice(-limit);
}

// =========================================
// Price Utilities
// =========================================

/**
 * Convert price string (e.g., "$0.01") to base units (e.g., "10000" for 6 decimals)
 */
function priceToBaseUnits(priceString: string): string {
  // Remove $ and parse as float
  const price = parseFloat(priceString.replace('$', ''));

  // Convert to base units (6 decimals for USDC)
  const baseUnits = Math.round(price * 1_000_000);

  return baseUnits.toString();
}

/**
 * Generate payment requirements for a capability
 */
function generatePaymentRequirements(capabilitySlug: string): PaymentRequirements {
  const meta = CAPABILITIES_META[capabilitySlug as CapabilitySlug];

  if (!meta) {
    throw new Error(`Unknown capability: ${capabilitySlug}`);
  }

  const fac = getFacilitator();

  return fac.generatePaymentRequirements({
    payTo: config.recipientAddress,
    asset: paymentAsset,
    description: `CronosAI: ${meta.name}`,
    maxAmountRequired: priceToBaseUnits(meta.price),
    mimeType: 'application/json',
    maxTimeoutSeconds: 300, // 5 minutes
    resource: `/capability/${capabilitySlug}`,
  });
}

// =========================================
// Helpers
// =========================================

/**
 * Extract slug from request path or params
 * Note: When middleware runs before route matching, params may be empty,
 * so we also try to extract from the path directly.
 */
function getSlugParam(req: Request): string | undefined {
  // Try params first
  const param = req.params['slug'];
  if (param) {
    return Array.isArray(param) ? param[0] : param;
  }

  // Fallback: extract from path (e.g., "/contract-scan" -> "contract-scan")
  const pathMatch = req.path.match(/^\/([a-z-]+)$/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return undefined;
}

// =========================================
// Mock Middleware (development only)
// =========================================

function createMockMiddleware() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const slug = getSlugParam(req);

    if (slug) {
      console.log(`\x1b[33m[x402 MOCK]\x1b[0m Bypassing payment for: ${slug}`);

      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: CAPABILITIES_META[slug as CapabilitySlug]?.price ?? 'unknown',
        network: config.networkId,
        status: 'settled',
      });
    }

    next();
  };
}

// =========================================
// Production Middleware
// =========================================

function createProductionMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const slug = getSlugParam(req);

    if (!slug || !CAPABILITIES_META[slug as CapabilitySlug]) {
      // Not a capability request, pass through
      next();
      return;
    }

    const meta = CAPABILITIES_META[slug as CapabilitySlug];

    // Check for X-PAYMENT header (x402 payment proof)
    const paymentHeader = req.headers['x-payment'] as string | undefined;

    if (!paymentHeader) {
      // No payment - return 402 with payment requirements
      const paymentRequirements = generatePaymentRequirements(slug);

      const paymentInfo: X402PaymentInfo = {
        x402Version: 1,
        accepts: paymentRequirements,
      };

      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: meta.price,
        network: config.networkId,
        status: 'pending',
      });

      res.status(402).json(paymentInfo);
      return;
    }

    // Payment header present - verify and settle
    try {
      const fac = getFacilitator();
      const paymentRequirements = generatePaymentRequirements(slug);

      // Build verify request
      const verifyRequest: VerifyRequest = fac.buildVerifyRequest(
        paymentHeader,
        paymentRequirements
      );

      // Step 1: Verify payment
      const verifyResult = await fac.verifyPayment(verifyRequest);

      if (!verifyResult.isValid) {
        logPayment({
          timestamp: new Date().toISOString(),
          capability: slug,
          price: meta.price,
          network: config.networkId,
          status: 'failed',
        });

        res.status(402).json({
          x402Version: 1,
          error: verifyResult.invalidReason ?? 'Payment verification failed',
          accepts: paymentRequirements,
        });
        return;
      }

      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: meta.price,
        network: config.networkId,
        status: 'verified',
      });

      // Step 2: Settle payment (execute on-chain)
      const settleResult = await fac.settlePayment(verifyRequest);

      if (!settleResult.txHash) {
        logPayment({
          timestamp: new Date().toISOString(),
          capability: slug,
          price: meta.price,
          network: config.networkId,
          status: 'failed',
        });

        res.status(402).json({
          x402Version: 1,
          error: settleResult.error ?? 'Payment settlement failed',
          accepts: paymentRequirements,
        });
        return;
      }

      // Payment successful!
      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: meta.price,
        network: config.networkId,
        transactionHash: settleResult.txHash,
        payerAddress: settleResult.from,
        status: 'settled',
      });

      // Attach payment info to request for downstream use
      (req as Request & { x402Payment?: typeof settleResult }).x402Payment = settleResult;

      // Continue to capability execution
      next();
    } catch (error) {
      console.error('[x402] Error processing payment:', error);

      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: meta.price,
        network: config.networkId,
        status: 'failed',
      });

      res.status(500).json({
        success: false,
        error: 'PAYMENT_ERROR',
        message: 'Failed to process payment. Please try again.',
      });
    }
  };
}

// =========================================
// Middleware Factory
// =========================================

export async function createX402Middleware(): Promise<
  (req: Request, res: Response, next: NextFunction) => void | Promise<void>
> {
  // Mock mode (development only)
  if (config.skipX402) {
    console.log(`\x1b[33m[x402] Running in MOCK mode\x1b[0m`);
    return createMockMiddleware();
  }

  // Production mode
  console.log(`[x402] Initialized for ${config.networkId}`);
  console.log(`[x402] Payment token: ${config.paymentToken.symbol} (${config.paymentToken.address})`);
  console.log(`[x402] Recipient: ${config.recipientAddress}`);

  return createProductionMiddleware();
}

// =========================================
// Utility Exports
// =========================================

export function getPaymentRequirementsForCapability(slug: string): PaymentRequirements {
  return generatePaymentRequirements(slug);
}

export { cronosNetwork, paymentAsset };
