// =========================================
// CronosAI Ops - Network Configuration
// Single source of truth for all network-related constants
// =========================================

/**
 * Supported networks
 */
export type NetworkMode = 'testnet' | 'mainnet';

/**
 * Network identifiers for x402 (as expected by Cronos facilitator)
 */
export const NETWORK_IDS = {
  testnet: 'cronos-testnet',
  mainnet: 'cronos-mainnet',
} as const;

/**
 * Chain IDs
 */
export const CHAIN_IDS = {
  testnet: 338,
  mainnet: 25,
} as const;

/**
 * RPC URLs (public endpoints)
 */
export const RPC_URLS = {
  testnet: 'https://evm-t3.cronos.org',
  mainnet: 'https://evm.cronos.org',
} as const;

/**
 * Explorer URLs
 */
export const EXPLORER_URLS = {
  testnet: 'https://explorer.cronos.org/testnet',
  mainnet: 'https://cronoscan.com',
} as const;

/**
 * Explorer API URLs
 */
export const EXPLORER_API_URLS = {
  testnet: 'https://api-testnet.cronoscan.com/api',
  mainnet: 'https://api.cronoscan.com/api',
} as const;

/**
 * Facilitator URL (same for both networks, network is specified in request)
 * Source: https://docs.cronos.org/cronos-x402-facilitator/api-reference
 */
export const FACILITATOR_URL = 'https://facilitator.cronoslabs.org/v2/x402';

/**
 * Token configuration per network
 * USDCe is the supported token for x402 on Cronos
 */
export const TOKENS = {
  testnet: {
    // devUSDCe on testnet (implements EIP-3009)
    USDCe: {
      address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0',
      symbol: 'devUSDCe',
      name: 'Dev Bridged USDC (Stargate)',
      decimals: 6,
    },
  },
  mainnet: {
    // USDCe on mainnet (implements EIP-3009)
    USDCe: {
      address: '0xf951eC28187D9E5Ca673Da8FE6757E6f0Be5F77C',
      symbol: 'USDCe',
      name: 'Bridged USDC (Stargate)',
      decimals: 6,
    },
  },
} as const;

/**
 * VVS Finance addresses (for tx-simulate capability)
 */
export const VVS_ADDRESSES = {
  testnet: {
    router: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae', // Same on testnet
    factory: '0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15',
  },
  mainnet: {
    router: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
    factory: '0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15',
  },
} as const;

/**
 * Native token (CRO/TCRO)
 */
export const NATIVE_TOKEN = {
  testnet: {
    symbol: 'TCRO',
    name: 'Test CRO',
    decimals: 18,
    faucet: 'https://cronos.org/faucet',
  },
  mainnet: {
    symbol: 'CRO',
    name: 'Cronos',
    decimals: 18,
  },
} as const;

/**
 * Get all network config for a given mode
 */
export function getNetworkConfig(mode: NetworkMode) {
  return {
    mode,
    networkId: NETWORK_IDS[mode],
    chainId: CHAIN_IDS[mode],
    rpcUrl: RPC_URLS[mode],
    explorerUrl: EXPLORER_URLS[mode],
    explorerApiUrl: EXPLORER_API_URLS[mode],
    facilitatorUrl: FACILITATOR_URL,
    paymentToken: TOKENS[mode].USDCe,
    nativeToken: NATIVE_TOKEN[mode],
    vvs: VVS_ADDRESSES[mode],
  };
}

/**
 * Validate that a network mode is valid
 */
export function isValidNetworkMode(mode: string): mode is NetworkMode {
  return mode === 'testnet' || mode === 'mainnet';
}
