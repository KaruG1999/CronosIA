// =========================================
// CronosAI Ops - Capabilities Registry
// =========================================

import { z } from 'zod';
import type { CapabilityResult } from '../../shared/types.js';

/**
 * Capability definition with schema validation
 */
export interface Capability<TInput = unknown, TOutput = unknown> {
  name: string;
  slug: string;
  price: string;
  priceUSDC: number;
  description: string;
  limitations: readonly string[];
  inputSchema: z.ZodSchema<TInput>;
  execute: (input: TInput) => Promise<CapabilityResult<TOutput>>;
}

/**
 * Capability metadata (without execute function)
 */
export interface CapabilityInfo {
  name: string;
  slug: string;
  price: string;
  priceUSDC: number;
  description: string;
  limitations: readonly string[];
}

/**
 * Registry of all available capabilities
 */
const capabilityRegistry = new Map<string, Capability>();

/**
 * Register a capability
 */
export function registerCapability<TInput, TOutput>(
  capability: Capability<TInput, TOutput>
): void {
  if (capabilityRegistry.has(capability.slug)) {
    console.warn(`[Capabilities] Overwriting capability: ${capability.slug}`);
  }
  capabilityRegistry.set(capability.slug, capability as Capability);
  console.log(`[Capabilities] Registered: ${capability.slug} (${capability.price})`);
}

/**
 * Get a capability by slug
 */
export function getCapability(slug: string): Capability | undefined {
  return capabilityRegistry.get(slug);
}

/**
 * Get all registered capabilities info
 */
export function getAllCapabilities(): CapabilityInfo[] {
  return Array.from(capabilityRegistry.values()).map(cap => ({
    name: cap.name,
    slug: cap.slug,
    price: cap.price,
    priceUSDC: cap.priceUSDC,
    description: cap.description,
    limitations: cap.limitations,
  }));
}

/**
 * Check if a capability exists
 */
export function hasCapability(slug: string): boolean {
  return capabilityRegistry.has(slug);
}

/**
 * Capability registry metadata
 */
export const CAPABILITIES_META = {
  'contract-scan': {
    name: 'Contract Scan',
    slug: 'contract-scan',
    price: '$0.01',
    priceUSDC: 0.01,
    description: 'Analyze a smart contract for risk signals and red flags',
    limitations: [
      'Does not guarantee 100% safety',
      'Based on heuristics and public data',
      'New contracts may lack history',
    ],
  },
  'wallet-approvals': {
    name: 'Wallet Approvals',
    slug: 'wallet-approvals',
    price: '$0.02',
    priceUSDC: 0.02,
    description: 'List active token approvals and identify risky spenders',
    limitations: [
      'Risk classification is estimated',
      'Does not cover all permission types',
      'New contracts may not be classified',
    ],
  },
  'tx-simulate': {
    name: 'Tx Simulate',
    slug: 'tx-simulate',
    price: '$0.03',
    priceUSDC: 0.03,
    description: 'Preview swap output, price impact, and route before executing',
    limitations: [
      'Results may vary if state changes',
      'Does not include gas fees in calculation',
      'Only supports VVS Finance swaps',
    ],
  },
} as const;

export type CapabilitySlug = keyof typeof CAPABILITIES_META;
