// =========================================
// CronosAI Ops - Blockchain RPC Service
// =========================================

import { JsonRpcProvider } from 'ethers';
import { config } from '../shared/config.js';

let provider: JsonRpcProvider | null = null;

const RPC_TIMEOUT_MS = 10000;

/**
 * Get or create JSON-RPC provider singleton
 */
export function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new JsonRpcProvider(config.rpcUrl, config.chainId, {
      staticNetwork: true,
    });
  }
  return provider;
}

/**
 * Check if an address is a contract (has code)
 */
export async function isContract(address: string): Promise<boolean> {
  const provider = getProvider();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const code = await provider.getCode(address);
    return code !== '0x' && code.length > 2;
  } catch (error) {
    console.error(`[Blockchain] Error checking contract code for ${address}:`, error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get current block number
 */
export async function getBlockNumber(): Promise<number> {
  const provider = getProvider();
  return provider.getBlockNumber();
}

/**
 * Get balance for an address
 */
export async function getBalance(address: string): Promise<bigint> {
  const provider = getProvider();
  return provider.getBalance(address);
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize address to checksum format
 */
export function normalizeAddress(address: string): string {
  // Simple lowercase normalization for now
  // ethers will handle checksum when needed
  return address.toLowerCase();
}
