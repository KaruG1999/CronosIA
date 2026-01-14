// =========================================
// CronosAI Ops - Configuration
// Validated with Zod, network-aware, fail-fast
// =========================================

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { getNetworkConfig, type NetworkMode } from './network.js';

// Load environment variables
dotenvConfig();

// =========================================
// Environment Schema (Zod validation)
// =========================================

const envSchema = z.object({
  // Network mode (testnet or mainnet)
  NETWORK_MODE: z.enum(['testnet', 'mainnet']).default('testnet'),

  // Mainnet requires explicit opt-in
  ENABLE_MAINNET: z.string().optional().transform(v => v === 'true'),

  // Claude API
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Recipient wallet (receives payments)
  RECIPIENT_ADDRESS: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    'RECIPIENT_ADDRESS must be a valid Ethereum address (0x + 40 hex chars)'
  ),

  // Explorer API key (optional but recommended)
  CRONOS_EXPLORER_API_KEY: z.string().optional().default(''),

  // App settings
  PORT: z.string().optional().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Development flags (MOCK mode for local dev only)
  SKIP_X402: z.string().optional().transform(v => v === 'true'),
});

// =========================================
// Parse and Validate Environment
// =========================================

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n========================================');
    console.error('  CONFIGURATION ERROR');
    console.error('========================================\n');

    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      console.error(`  [${path}] ${issue.message}`);
    }

    console.error('\n  Please check your .env file.');
    console.error('  See .env.testnet.example for reference.\n');
    console.error('========================================\n');

    process.exit(1);
  }

  return result.data;
}

const env = parseEnv();

// =========================================
// Mainnet Safety Check
// =========================================

if (env.NETWORK_MODE === 'mainnet' && !env.ENABLE_MAINNET) {
  console.error('\n========================================');
  console.error('  MAINNET SAFETY CHECK FAILED');
  console.error('========================================\n');
  console.error('  You are trying to run on MAINNET but ENABLE_MAINNET is not set.');
  console.error('  Mainnet uses REAL FUNDS and requires explicit opt-in.\n');
  console.error('  To enable mainnet, add to your .env:');
  console.error('    ENABLE_MAINNET=true\n');
  console.error('  Make sure you understand the implications:');
  console.error('    - Real USDCe will be used for payments');
  console.error('    - Real CRO needed for gas fees');
  console.error('    - This is NOT a test environment\n');
  console.error('========================================\n');

  process.exit(1);
}

// =========================================
// Mock Mode Warning
// =========================================

if (env.SKIP_X402 && env.NODE_ENV !== 'development') {
  console.error('\n========================================');
  console.error('  MOCK MODE NOT ALLOWED');
  console.error('========================================\n');
  console.error('  SKIP_X402=true is only allowed in development mode.');
  console.error('  Current NODE_ENV:', env.NODE_ENV);
  console.error('\n  Remove SKIP_X402=true or set NODE_ENV=development\n');
  console.error('========================================\n');

  process.exit(1);
}

if (env.SKIP_X402) {
  console.warn('\n========================================');
  console.warn('  WARNING: MOCK MODE ENABLED');
  console.warn('========================================');
  console.warn('  SKIP_X402=true - Payments are BYPASSED');
  console.warn('  This should only be used for local development.');
  console.warn('  Never deploy with this flag enabled!');
  console.warn('========================================\n');
}

// =========================================
// Build Configuration Object
// =========================================

const networkConfig = getNetworkConfig(env.NETWORK_MODE as NetworkMode);

export const config = {
  // Network configuration
  network: networkConfig,
  networkMode: env.NETWORK_MODE as NetworkMode,
  isMainnet: env.NETWORK_MODE === 'mainnet',
  isTestnet: env.NETWORK_MODE === 'testnet',

  // Chain settings (derived from network)
  chainId: networkConfig.chainId,
  rpcUrl: networkConfig.rpcUrl,
  networkId: networkConfig.networkId,

  // Facilitator
  facilitatorUrl: networkConfig.facilitatorUrl,

  // Payment token (USDCe or devUSDCe)
  paymentToken: networkConfig.paymentToken,

  // Recipient wallet
  recipientAddress: env.RECIPIENT_ADDRESS,

  // Explorer
  explorerApiUrl: networkConfig.explorerApiUrl,
  explorerApiKey: env.CRONOS_EXPLORER_API_KEY,

  // Claude API
  anthropicApiKey: env.ANTHROPIC_API_KEY,

  // VVS Finance
  vvsRouterAddress: networkConfig.vvs.router,
  vvsFactoryAddress: networkConfig.vvs.factory,

  // App settings
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  frontendUrl: env.FRONTEND_URL,
  logLevel: env.LOG_LEVEL,

  // Development flags
  skipX402: env.SKIP_X402 ?? false,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const;

// =========================================
// Startup Info
// =========================================

export function printStartupInfo(): void {
  const networkLabel = config.isMainnet
    ? '\x1b[31mMAINNET (REAL FUNDS)\x1b[0m'
    : '\x1b[32mTESTNET (Demo)\x1b[0m';

  console.log('');
  console.log('=========================================');
  console.log('  CronosAI Ops - Configuration');
  console.log('=========================================');
  console.log(`  Network:        ${networkLabel}`);
  console.log(`  Chain ID:       ${config.chainId}`);
  console.log(`  RPC URL:        ${config.rpcUrl}`);
  console.log(`  Payment Token:  ${config.paymentToken.symbol}`);
  console.log(`  Recipient:      ${config.recipientAddress.slice(0, 6)}...${config.recipientAddress.slice(-4)}`);
  console.log(`  x402 Mode:      ${config.skipX402 ? '\x1b[33mMOCK (dev only)\x1b[0m' : 'LIVE'}`);
  console.log('=========================================');
  console.log('');
}

// Export type for config
export type Config = typeof config;
