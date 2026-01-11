// =========================================
// CronosAI Ops - x402 Payment Middleware
// =========================================

import type { Request, Response, NextFunction } from 'express';
import { config } from '../../shared/config.js';
import { CAPABILITIES_META, type CapabilitySlug } from '../../core/capabilities/index.js';

/**
 * Cronos network identifier for x402
 * Cronos Mainnet: eip155:25
 * Cronos Testnet: eip155:338
 */
const CRONOS_NETWORK = `eip155:${config.chainId}` as const;

/**
 * USDC token address on Cronos
 */
const CRONOS_USDC = '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59';

/**
 * Generate route configs for all capabilities
 * Uses x402 RoutesConfig format
 */
function generateRouteConfigs() {
  // Build routes config compatible with x402
  const routes: Record<string, unknown> = {};

  for (const [slug, meta] of Object.entries(CAPABILITIES_META)) {
    const routeKey = `POST /capability/${slug}`;
    routes[routeKey] = {
      accepts: {
        scheme: 'exact',
        price: meta.price,
        network: CRONOS_NETWORK,
        payTo: config.recipientAddress,
        asset: CRONOS_USDC,
      },
      description: meta.description,
    };
  }

  return routes;
}

/**
 * Payment info logged for each transaction
 */
interface PaymentLog {
  timestamp: string;
  capability: string;
  price: string;
  payerAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'verified' | 'failed';
}

const paymentLogs: PaymentLog[] = [];

/**
 * Log a payment attempt
 */
function logPayment(log: PaymentLog): void {
  paymentLogs.push(log);
  console.log(`[x402] Payment ${log.status}:`, {
    capability: log.capability,
    price: log.price,
    payer: log.payerAddress ?? 'unknown',
  });
}

/**
 * Get recent payment logs
 */
export function getPaymentLogs(limit = 100): PaymentLog[] {
  return paymentLogs.slice(-limit);
}

/**
 * Development mock middleware - skips payment verification
 */
function createMockMiddleware() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const slug = req.params['slug'];
    if (slug) {
      console.log(`[x402 MOCK] Skipping payment for capability: ${slug}`);
      logPayment({
        timestamp: new Date().toISOString(),
        capability: slug,
        price: CAPABILITIES_META[slug as CapabilitySlug]?.price ?? 'unknown',
        status: 'verified',
      });
    }
    next();
  };
}

/**
 * Production x402 middleware
 */
async function createProductionMiddleware() {
  // Dynamic imports to avoid loading heavy deps when not needed
  const { paymentMiddleware, x402ResourceServer } = await import('@x402/express');
  const { HTTPFacilitatorClient } = await import('@x402/core/server');
  const { ExactEvmScheme } = await import('@x402/evm/exact/server');

  // Validate required config
  if (!config.recipientAddress) {
    throw new Error('RECIPIENT_ADDRESS is required for x402 payments');
  }

  // Create facilitator client
  const facilitatorClient = new HTTPFacilitatorClient({
    url: config.x402FacilitatorUrl,
  });

  // Create resource server with EVM scheme
  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register(CRONOS_NETWORK, new ExactEvmScheme());

  // Generate route configs
  const routes = generateRouteConfigs();

  console.log('[x402] Configured routes:', Object.keys(routes));

  // Create the middleware (type assertion needed due to x402 internal types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return paymentMiddleware(routes as any, resourceServer);
}

/**
 * x402 middleware factory
 * Returns mock in development if SKIP_X402=true, otherwise returns real middleware
 */
export async function createX402Middleware(): Promise<(req: Request, res: Response, next: NextFunction) => void | Promise<void>> {
  if (config.skipX402) {
    console.log('[x402] Running in MOCK mode (SKIP_X402=true)');
    return createMockMiddleware();
  }

  if (config.nodeEnv === 'development' && !config.recipientAddress) {
    console.warn('[x402] No RECIPIENT_ADDRESS configured, running in MOCK mode');
    return createMockMiddleware();
  }

  try {
    const middleware = await createProductionMiddleware();
    console.log('[x402] Production middleware initialized');
    return middleware;
  } catch (error) {
    console.error('[x402] Failed to initialize production middleware:', error);
    if (config.nodeEnv === 'development') {
      console.warn('[x402] Falling back to MOCK mode');
      return createMockMiddleware();
    }
    throw error;
  }
}

/**
 * Get route configuration (for debugging/info)
 */
export function getRouteConfigs(): Record<string, unknown> {
  return generateRouteConfigs();
}
