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
    name: 'Scan de Contrato',
    slug: 'contract-scan',
    price: '$0.01',
    priceUSDC: 0.01,
    description: 'Analiza un contrato para detectar senales de riesgo',
    limitations: [
      'No garantiza seguridad al 100%',
      'Basado en heuristicas y datos publicos',
      'Contratos nuevos pueden no tener historial',
    ],
  },
  'wallet-approvals': {
    name: 'Check de Approvals',
    slug: 'wallet-approvals',
    price: '$0.02',
    priceUSDC: 0.02,
    description: 'Lista los token approvals activos y detecta riesgos',
    limitations: [
      'Clasificacion de riesgo es estimada',
      'No cubre todos los tipos de permisos',
      'Contratos nuevos pueden no estar clasificados',
    ],
  },
  'tx-simulate': {
    name: 'Simulacion de Transaccion',
    slug: 'tx-simulate',
    price: '$0.03',
    priceUSDC: 0.03,
    description: 'Simula una operacion para ver el resultado esperado',
    limitations: [
      'Resultado puede variar si el estado cambia',
      'No incluye gas fees en el calculo',
      'Solo soporta swaps en VVS Finance',
    ],
  },
} as const;

export type CapabilitySlug = keyof typeof CAPABILITIES_META;
