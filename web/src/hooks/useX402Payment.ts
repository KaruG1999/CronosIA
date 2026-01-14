// =========================================
// x402 Payment Utilities
// Handles payment header generation for Cronos x402 protocol
// =========================================

import {
  Facilitator,
  CronosNetwork,
  type PaymentRequirements,
} from '@crypto.com/facilitator-client';
import { BrowserProvider, type Eip1193Provider } from 'ethers';
import type { WalletClient } from 'viem';

// =========================================
// Types
// =========================================

export type X402PaymentState =
  | 'idle'
  | 'awaiting_approval'    // Waiting for user to click "Confirm & Pay"
  | 'opening_wallet'       // Opening MetaMask
  | 'signing'              // User signing in wallet
  | 'confirming'           // Waiting for tx confirmation
  | 'retrying_request'     // Retrying original request with payment proof
  | 'settled'              // Payment successful
  | 'error';               // Payment failed

export interface X402Challenge {
  x402Version: number;
  accepts: PaymentRequirements;
  error?: string;
}

// =========================================
// Constants
// =========================================

const CRONOS_TESTNET_CHAIN_ID = 338;
const CRONOS_MAINNET_CHAIN_ID = 25;

// Network detection from env
const getNetworkMode = (): 'testnet' | 'mainnet' => {
  const mode = import.meta.env.VITE_CRONOS_NETWORK;
  return mode === 'mainnet' ? 'mainnet' : 'testnet';
};

export const getExpectedChainId = (): number => {
  return getNetworkMode() === 'mainnet'
    ? CRONOS_MAINNET_CHAIN_ID
    : CRONOS_TESTNET_CHAIN_ID;
};

// =========================================
// Ethers Signer from Viem WalletClient
// =========================================

/**
 * Creates an ethers signer from viem's walletClient
 * This is needed because @crypto.com/facilitator-client uses ethers
 */
async function getEthersSigner(walletClient: WalletClient) {
  // Get the underlying provider (window.ethereum)
  const transport = walletClient.transport;

  // The transport should have the underlying EIP-1193 provider
  // For injected wallets, this is window.ethereum
  let provider: Eip1193Provider;

  if ('provider' in transport && transport.provider) {
    provider = transport.provider as Eip1193Provider;
  } else if (typeof window !== 'undefined' && window.ethereum) {
    provider = window.ethereum as Eip1193Provider;
  } else {
    throw new Error('No EIP-1193 provider found');
  }

  // Create ethers provider and get signer
  const ethersProvider = new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  return signer;
}

// =========================================
// Payment Header Generation
// =========================================

/**
 * Creates the X-PAYMENT header for x402 protocol
 * This function will open MetaMask for user to sign the payment
 */
export async function createX402PaymentHeader(
  challenge: X402Challenge,
  walletClient: WalletClient
): Promise<string> {
  console.log('[x402] Creating payment header...');

  // Validate inputs
  if (!challenge.accepts) {
    throw new Error('Invalid x402 challenge: missing payment requirements');
  }

  if (!walletClient || !walletClient.account) {
    throw new Error('Wallet not connected');
  }

  // Validate chain
  const currentChainId = walletClient.chain?.id;
  const expectedChainId = getExpectedChainId();

  console.log(`[x402] Chain check - Current: ${currentChainId}, Expected: ${expectedChainId}`);

  if (currentChainId !== expectedChainId) {
    const networkName = getNetworkMode() === 'mainnet' ? 'Cronos Mainnet' : 'Cronos Testnet';
    throw new Error(
      `Wrong network. Please switch to ${networkName} (Chain ID: ${expectedChainId})`
    );
  }

  // Initialize facilitator for the correct network
  const network = getNetworkMode() === 'mainnet'
    ? CronosNetwork.CronosMainnet
    : CronosNetwork.CronosTestnet;

  const facilitator = new Facilitator({ network });
  console.log('[x402] Facilitator initialized for:', network);

  // Get ethers signer from viem walletClient
  console.log('[x402] Getting ethers signer...');
  const signer = await getEthersSigner(walletClient);

  // Extract payment details from challenge
  const { accepts } = challenge;
  console.log('[x402] Payment requirements:', accepts);

  // Generate the payment header (this opens MetaMask)
  console.log('[x402] Requesting wallet signature...');
  const paymentHeader = await facilitator.generatePaymentHeader({
    to: accepts.payTo,
    value: accepts.maxAmountRequired,
    asset: accepts.asset,
    signer: signer,
  });

  console.log('[x402] Payment header generated successfully');
  return paymentHeader;
}

// =========================================
// State Display Helpers
// =========================================

export const X402_STATE_MESSAGES: Record<X402PaymentState, string> = {
  idle: '',
  awaiting_approval: 'Ready to pay',
  opening_wallet: 'Opening wallet...',
  signing: 'Please sign in your wallet...',
  confirming: 'Confirming transaction...',
  retrying_request: 'Finalizing...',
  settled: 'Payment complete!',
  error: 'Payment failed',
};

export const X402_STATE_IS_PROCESSING: Record<X402PaymentState, boolean> = {
  idle: false,
  awaiting_approval: false,
  opening_wallet: true,
  signing: true,
  confirming: true,
  retrying_request: true,
  settled: false,
  error: false,
};
