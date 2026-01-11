import type { ApiResponse, CapabilitySlug } from '../types';

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

// Error types
export interface ApiErrorInfo {
  message: string;
  status: number;
}

export interface PaymentInfo {
  price: string;
  token: string;
  network: string;
}

export async function executeCapability(
  capability: CapabilitySlug,
  input: CapabilityInput
): Promise<ApiResponse> {
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
      const paymentInfo = await response.json();
      const error = new Error('Payment required') as Error & { paymentInfo: unknown };
      error.paymentInfo = paymentInfo;
      error.name = 'PaymentRequiredError';
      throw error;
    }

    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    const error = new Error(errorData.message || 'Request failed') as Error & { status: number };
    error.status = response.status;
    error.name = 'ApiError';
    throw error;
  }

  return response.json();
}

// Parse user input for tx-simulate
export function parseSwapInput(input: string): TxSimulateInput | null {
  // Match patterns like "100 CRO a USDC" or "100 CRO to USDC"
  const match = input.match(/(\d+(?:\.\d+)?)\s*(\w+)\s+(?:a|to|->|→)\s*(\w+)/i);

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

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Extract address from input
export function extractAddress(input: string): string | null {
  const match = input.match(/0x[a-fA-F0-9]{40}/);
  return match ? match[0] : null;
}
