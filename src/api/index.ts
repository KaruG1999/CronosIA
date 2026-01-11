// =========================================
// CronosAI Ops - Express Server
// =========================================

import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from '../shared/config.js';
import { healthRouter } from './routes/health.js';
import { capabilitiesRouter } from './routes/capabilities.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { registerContractScanCapability } from '../core/capabilities/contract-scan.js';
import { registerWalletApprovalsCapability } from '../core/capabilities/wallet-approvals.js';
import { registerTxSimulateCapability } from '../core/capabilities/tx-simulate.js';
import { createX402Middleware } from './middleware/x402.js';

const app = express();

// =========================================
// Middleware
// =========================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment'],
  })
);

// Body parsing
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =========================================
// Routes
// =========================================

app.use('/health', healthRouter);

// Note: /capability routes are mounted in startServer after x402 init

// =========================================
// Server Startup
// =========================================

function registerCapabilities(): void {
  console.log('[Startup] Registering capabilities...');
  registerContractScanCapability();
  registerWalletApprovalsCapability();
  registerTxSimulateCapability();
}

async function startServer(): Promise<void> {
  // Validate configuration
  const { valid, missing } = validateConfig();

  if (!valid) {
    console.warn(`[WARN] Missing environment variables: ${missing.join(', ')}`);
    if (config.nodeEnv === 'production') {
      console.error('[ERROR] Cannot start in production with missing config');
      process.exit(1);
    }
  }

  // Register all capabilities
  registerCapabilities();

  // Initialize x402 middleware
  const x402Middleware = await createX402Middleware();

  // Mount capability routes with x402 protection
  const protectedRouter = Router();
  protectedRouter.use(x402Middleware);
  protectedRouter.use(capabilitiesRouter);
  app.use('/capability', protectedRouter);

  // Error handlers must be last
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log('');
    console.log('=========================================');
    console.log('  CronosAI Ops Server');
    console.log('=========================================');
    console.log(`  Environment:  ${config.nodeEnv}`);
    console.log(`  Port:         ${config.port}`);
    console.log(`  x402 Mode:    ${config.skipX402 ? 'MOCK' : 'PRODUCTION'}`);
    console.log(`  Health:       http://localhost:${config.port}/health`);
    console.log(`  Capabilities: http://localhost:${config.port}/capability`);
    console.log('=========================================');
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('[FATAL] Failed to start server:', error);
  process.exit(1);
});

export { app };
