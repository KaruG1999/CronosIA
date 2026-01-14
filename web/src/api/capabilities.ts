import type { ApiResponse, CapabilitySlug } from '../types';
import type { X402Challenge } from '../hooks/useX402Payment';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ContractScanInput {
  address: string;
}

export interface WalletApprovalsInput {
  address: string;
}

export interface TxSimulateInput {
  action: 'swap';
  params: {
    token_in: string;
    token_out: string;
    amount: number;
  };
}

export type CapabilityInput = ContractScanInput | WalletApprovalsInput | TxSimulateInput;

// =========================================
// Error Types
// =========================================

export class PaymentRequiredError extends Error {
  public readonly challenge: X402Challenge;
  public readonly capability: CapabilitySlug;
  public readonly input: CapabilityInput;

  constructor(
    challenge: X402Challenge,
    capability: CapabilitySlug,
    input: CapabilityInput
  ) {
    super('Payment required (x402)');
    this.name = 'PaymentRequiredError';
    this.challenge = challenge;
    this.capability = capability;
    this.input = input;
  }
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// =========================================
// API Functions
// =========================================

/**
 * Execute a capability WITHOUT payment (initial request)
 * This will return a 402 response with payment requirements
 */
export async function executeCapability(
  capability: CapabilitySlug,
  input: CapabilityInput
): Promise<ApiResponse> {
  console.log(`[API] Executing capability: ${capability}`);

  const response = await fetch(`${API_BASE}/capability/${capability}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    // Handle 402 Payment Required
    if (response.status === 402) {
      console.log('[API] Received 402 Payment Required');
      const challenge = await response.json() as X402Challenge;
      console.log('[API] Payment challenge:', challenge);
      throw new PaymentRequiredError(challenge, capability, input);
    }

    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(errorData.message || 'Request failed', response.status);
  }

  return response.json();
}

/**
 * Execute a capability WITH payment proof (after x402 payment)
 * Includes the X-PAYMENT header with the signed payment
 */
export async function executeCapabilityWithPayment(
  capability: CapabilitySlug,
  input: CapabilityInput,
  paymentHeader: string
): Promise<ApiResponse> {
  console.log(`[API] Executing capability with payment: ${capability}`);
  console.log('[API] Payment header present:', !!paymentHeader);

  const response = await fetch(`${API_BASE}/capability/${capability}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PAYMENT': paymentHeader,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    // Even after payment, could get 402 if payment verification failed
    if (response.status === 402) {
      console.error('[API] Payment verification failed');
      const errorData = await response.json();
      throw new ApiError(
        errorData.error || 'Payment verification failed. Please try again.',
        402
      );
    }

    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(errorData.message || 'Request failed', response.status);
  }

  console.log('[API] Request successful after payment');
  return response.json();
}

// =========================================
// Input Parsing Utilities
// =========================================

/**
 * Parse user input for tx-simulate
 * Matches patterns like "100 CRO to USDC" or "100 CRO -> USDC"
 */
export function parseSwapInput(input: string): TxSimulateInput | null {
  const match = input.match(/(\d+(?:\.\d+)?)\s*(\w+)\s+(?:to|->|→)\s*(\w+)/i);

  if (!match) return null;

  const [, amount, tokenIn, tokenOut] = match;

  return {
    action: 'swap',
    params: {
      token_in: tokenIn.toUpperCase(),
      token_out: tokenOut.toUpperCase(),
      amount: parseFloat(amount),
    },
  };
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Extract Ethereum address from user input
 */
export function extractAddress(input: string): string | null {
  const match = input.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}

// =========================================
// Network Info
// =========================================

export async function fetchNetworkInfo(): Promise<{
  mode: string;
  chainId: number;
  paymentToken: { symbol: string; address: string; decimals: number };
}> {
  const response = await fetch(`${API_BASE}/network`);
  if (!response.ok) {
    throw new Error('Failed to fetch network info');
  }
  const data = await response.json();
  return data.network;
}
