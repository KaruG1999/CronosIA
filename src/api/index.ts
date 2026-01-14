// =========================================
// CronosAI Ops - Express Server
// Production-grade x402 payment server
// =========================================

import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, printStartupInfo } from '../shared/config.js';
import { healthRouter } from './routes/health.js';
import { capabilitiesRouter } from './routes/capabilities.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { registerContractScanCapability } from '../core/capabilities/contract-scan.js';
import { registerWalletApprovalsCapability } from '../core/capabilities/wallet-approvals.js';
import { registerTxSimulateCapability } from '../core/capabilities/tx-simulate.js';
import { createX402Middleware } from './middleware/x402.js';
import { capabilityRateLimiter, infoRateLimiter } from './middleware/rateLimit.js';

const app = express();

// =========================================
// Security Middleware
// =========================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// =========================================
// CORS Configuration
// =========================================

// Build list of allowed origins from config
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Add FRONTEND_URL if set
  if (config.frontendUrl) {
    origins.push(config.frontendUrl);
  }

  // Add all origins from ALLOWED_ORIGINS env var
  if (config.allowedOrigins.length > 0) {
    origins.push(...config.allowedOrigins);
  }

  return origins;
};

// Check if origin matches Vercel preview deployment pattern
const isVercelPreview = (origin: string): boolean => {
  // Matches: https://<project>-<hash>-<username>.vercel.app
  // or: https://<project>.vercel.app
  return /^https:\/\/[\w-]+(-[\w]+)*\.vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);

      // In development, allow any localhost port
      if (config.isDevelopment && origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      // Check against explicitly allowed origins
      const allowedOrigins = getAllowedOrigins();
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In production, also allow Vercel preview deployments
      // This enables testing on preview URLs without manual config
      if (config.isProduction && isVercelPreview(origin)) {
        console.log(`[CORS] Allowing Vercel preview: ${origin}`);
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Payment',
      'X-402-Token',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
  })
);

// Explicitly handle preflight OPTIONS requests
app.options('*', cors());

// =========================================
// Body Parsing
// =========================================

app.use(express.json({ limit: '10kb' }));

// =========================================
// Request Logging
// =========================================

app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;

  // Color-code by method
  const methodColors: Record<string, string> = {
    GET: '\x1b[32m',    // green
    POST: '\x1b[33m',   // yellow
    OPTIONS: '\x1b[36m', // cyan
  };
  const color = methodColors[method] ?? '\x1b[0m';
  const reset = '\x1b[0m';

  console.log(`[${timestamp}] ${color}${method}${reset} ${path}`);
  next();
});

// =========================================
// Network Info Endpoint
// =========================================

app.get('/network', infoRateLimiter, (_req, res) => {
  res.json({
    success: true,
    network: {
      mode: config.networkMode,
      networkId: config.networkId,
      chainId: config.chainId,
      isTestnet: config.isTestnet,
      isMainnet: config.isMainnet,
      paymentToken: {
        symbol: config.paymentToken.symbol,
        address: config.paymentToken.address,
        decimals: config.paymentToken.decimals,
      },
      explorerUrl: config.network.explorerUrl,
    },
  });
});

// =========================================
// Health Routes
// =========================================

app.use('/health', infoRateLimiter, healthRouter);

// =========================================
// Capability Registration
// =========================================

function registerCapabilities(): void {
  console.log('[Startup] Registering capabilities...');
  registerContractScanCapability();
  registerWalletApprovalsCapability();
  registerTxSimulateCapability();
}

// =========================================
// Server Startup
// =========================================

async function startServer(): Promise<void> {
  // Print startup info (network, config, etc.)
  printStartupInfo();

  // Register all capabilities
  registerCapabilities();

  // Initialize x402 middleware
  const x402Middleware = await createX402Middleware();

  // Mount capability routes with rate limiting and x402 protection
  const protectedRouter = Router();
  protectedRouter.use(capabilityRateLimiter);
  protectedRouter.use(x402Middleware);
  protectedRouter.use(capabilitiesRouter);
  app.use('/capability', protectedRouter);

  // Error handlers must be last
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start listening
  app.listen(config.port, () => {
    const networkLabel = config.isMainnet
      ? '\x1b[31mMAINNET\x1b[0m'
      : '\x1b[32mTESTNET\x1b[0m';

    console.log('');
    console.log('=========================================');
    console.log('  CronosAI Ops Server');
    console.log('=========================================');
    console.log(`  Network:        ${networkLabel}`);
    console.log(`  Port:           ${config.port}`);
    console.log(`  x402 Mode:      ${config.skipX402 ? '\x1b[33mMOCK\x1b[0m' : 'LIVE'}`);
    console.log(`  Health:         http://localhost:${config.port}/health`);
    console.log(`  Capabilities:   http://localhost:${config.port}/capability`);
    console.log(`  Network Info:   http://localhost:${config.port}/network`);
    console.log('=========================================');

    if (config.isMainnet) {
      console.log('');
      console.log('\x1b[31m  WARNING: Running on MAINNET with REAL FUNDS\x1b[0m');
      console.log('');
    }

    if (config.skipX402) {
      console.log('');
      console.log('\x1b[33m  WARNING: MOCK MODE - Payments are bypassed!\x1b[0m');
      console.log('');
    }
  });
}

startServer().catch((error) => {
  console.error('[FATAL] Failed to start server:', error);
  process.exit(1);
});

export { app };
