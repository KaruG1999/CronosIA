// =========================================
// CronosAI Ops - Configuration
// =========================================

/**
 * Environment configuration with defaults
 */
export const config = {
  // App
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  // Claude API
  anthropicApiKey: process.env['ANTHROPIC_API_KEY'] ?? '',

  // Cronos
  cronosRpcUrl: process.env['CRONOS_RPC_URL'] ?? 'https://evm.cronos.org',
  chainId: parseInt(process.env['CHAIN_ID'] ?? '25', 10),
  cronosExplorerApi: process.env['CRONOS_EXPLORER_API'] ?? 'https://api.cronoscan.com/api',
  cronosExplorerApiKey: process.env['CRONOS_EXPLORER_API_KEY'] ?? '',

  // x402
  x402FacilitatorUrl: process.env['X402_FACILITATOR_URL'] ?? 'https://x402-facilitator.cronos.org',
  recipientAddress: process.env['RECIPIENT_ADDRESS'] ?? '',

  // Development flags
  skipX402: process.env['SKIP_X402'] === 'true',
  logLevel: process.env['LOG_LEVEL'] ?? 'info',

  // Frontend
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',

  // VVS Finance
  vvsRouterAddress: process.env['VVS_ROUTER_ADDRESS'] ?? '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
  vvsFactoryAddress: process.env['VVS_FACTORY_ADDRESS'] ?? '0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15',
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config.anthropicApiKey) {
    missing.push('ANTHROPIC_API_KEY');
  }

  // x402 config only required in production
  if (config.nodeEnv === 'production' && !config.skipX402) {
    if (!config.recipientAddress) {
      missing.push('RECIPIENT_ADDRESS');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
