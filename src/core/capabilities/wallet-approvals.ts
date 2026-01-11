// =========================================
// CronosAI Ops - Wallet Approvals Capability
// =========================================

import { z } from 'zod';
import { Contract, MaxUint256 } from 'ethers';
import { registerCapability, CAPABILITIES_META } from './index.js';
import { getProvider, isValidAddress } from '../../services/blockchain.js';
import { getContractInfo } from '../../services/explorer.js';
import { createError, Errors } from '../../shared/errors.js';
import type { CapabilityResult, RiskLevel, Warning } from '../../shared/types.js';

/**
 * Input schema with strict validation
 */
const walletApprovalsInputSchema = z.object({
  address: z
    .string()
    .min(1, 'Address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

type WalletApprovalsInput = z.infer<typeof walletApprovalsInputSchema>;

/**
 * Approval info structure
 */
interface ApprovalInfo {
  token: string;
  tokenAddress: string;
  spender: string;
  spenderName: string;
  spenderVerified: boolean;
  amount: string;
  amountFormatted: string;
  isUnlimited: boolean;
  risk: RiskLevel;
}

/**
 * Output data structure
 */
interface WalletApprovalsData {
  wallet: string;
  totalApprovals: number;
  highRiskCount: number;
  approvals: ApprovalInfo[];
}

/**
 * Known spenders database on Cronos
 */
const KNOWN_SPENDERS: Record<string, { name: string; verified: boolean; category: string }> = {
  '0x145863eb42cf62847a6ca784e6416c1682b1b2ae': {
    name: 'VVS Finance Router',
    verified: true,
    category: 'DEX',
  },
  '0xeadf7c01da7e93fdb5f16b0aa9ee85f978e89e95': {
    name: 'Tectonic tCRO',
    verified: true,
    category: 'Lending',
  },
  '0x543f4db9bd26c9eb6ad4dd1c33522c966c625774': {
    name: 'VVS Finance Factory',
    verified: true,
    category: 'DEX',
  },
  '0xa111c17f8b8303280d3eb01bbcd61000aa7f39f9': {
    name: 'Ferro Swap',
    verified: true,
    category: 'DEX',
  },
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
    name: 'MM Finance Router',
    verified: true,
    category: 'DEX',
  },
};

/**
 * Common ERC20 tokens on Cronos
 */
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23': {
    symbol: 'WCRO',
    name: 'Wrapped CRO',
    decimals: 18,
  },
  '0xc21223249ca28397b4b6541dffaecc539bff0c59': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  '0x66e428c3f67a68878562e79a0234c1f83c208770': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  '0x2d03bece6747adc00e1a131bba1469c15fd11e03': {
    symbol: 'VVS',
    name: 'VVS Finance',
    decimals: 18,
  },
  '0xf2001b145b43032aaf5ee2884e456ccd805f677d': {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
};

// ERC20 ABI for approval checks
const ERC20_APPROVAL_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

/**
 * Classify approval risk level
 */
function classifyApprovalRisk(
  isUnlimited: boolean,
  spenderVerified: boolean,
  spenderKnown: boolean
): RiskLevel {
  // High risk: unlimited approval to unknown/unverified contract
  if (isUnlimited && !spenderVerified && !spenderKnown) {
    return 'high';
  }

  // Medium risk: unlimited approval to known but not verified, or limited approval to unknown
  if ((isUnlimited && !spenderVerified) || (!spenderKnown && !spenderVerified)) {
    return 'medium';
  }

  // Low risk: known/verified spender
  return 'low';
}

/**
 * Format approval amount for display
 */
function formatApprovalAmount(amount: bigint, decimals: number): string {
  if (amount === MaxUint256) {
    return 'Unlimited';
  }

  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === BigInt(0)) {
    return whole.toLocaleString();
  }

  // Format with up to 4 decimal places
  const decimalStr = remainder.toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toLocaleString()}.${decimalStr}`;
}

/**
 * Get spender info from known database or explorer
 */
async function getSpenderInfo(spenderAddress: string): Promise<{
  name: string;
  verified: boolean;
  known: boolean;
}> {
  const normalizedAddress = spenderAddress.toLowerCase();
  const known = KNOWN_SPENDERS[normalizedAddress];

  if (known) {
    return {
      name: known.name,
      verified: known.verified,
      known: true,
    };
  }

  // Try to get info from explorer
  try {
    const explorerInfo = await getContractInfo(spenderAddress);
    return {
      name: explorerInfo.contractName ?? 'Unknown Contract',
      verified: explorerInfo.verified,
      known: false,
    };
  } catch {
    return {
      name: 'Unknown',
      verified: false,
      known: false,
    };
  }
}

/**
 * Check approval for a specific token and spender
 */
async function checkApproval(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> {
  const provider = getProvider();
  const tokenContract = new Contract(tokenAddress, ERC20_APPROVAL_ABI, provider);

  try {
    const allowance = await tokenContract.getFunction('allowance')(ownerAddress, spenderAddress) as bigint;
    return allowance;
  } catch {
    return BigInt(0);
  }
}

/**
 * Execute wallet approvals check
 *
 * Note: This uses a simplified approach for the MVP.
 * In production, you would:
 * 1. Query the blockchain for all Approval events for this wallet
 * 2. Filter to find current active approvals
 * 3. Check on-chain current allowance for each
 *
 * For MVP/demo purposes, we check against known DEX routers and common tokens.
 */
async function executeWalletApprovals(
  input: WalletApprovalsInput
): Promise<CapabilityResult<WalletApprovalsData>> {
  const { address } = input;

  console.log(`[WalletApprovals] Checking approvals for ${address}`);

  // Validate address format
  if (!isValidAddress(address)) {
    throw createError(Errors.INVALID_ADDRESS);
  }

  const approvals: ApprovalInfo[] = [];

  // Check approvals for common tokens against known spenders
  // This is a simplified approach for MVP - in production we'd scan events
  const tokenAddresses = Object.keys(KNOWN_TOKENS);
  const spenderAddresses = Object.keys(KNOWN_SPENDERS);

  const provider = getProvider();

  // Check if we can connect to RPC
  try {
    await provider.getBlockNumber();
  } catch (error) {
    console.warn('[WalletApprovals] RPC connection failed, returning mock data');
    // Return mock data for demo purposes when RPC is unavailable
    return getMockApprovals(address);
  }

  for (const tokenAddr of tokenAddresses) {
    const tokenInfo = KNOWN_TOKENS[tokenAddr];
    if (!tokenInfo) continue;

    for (const spenderAddr of spenderAddresses) {
      try {
        const allowance = await checkApproval(tokenAddr, address, spenderAddr);

        // Only include if there's an actual approval
        if (allowance > BigInt(0)) {
          const spenderInfo = await getSpenderInfo(spenderAddr);
          const isUnlimited = allowance === MaxUint256;
          const risk = classifyApprovalRisk(isUnlimited, spenderInfo.verified, spenderInfo.known);

          approvals.push({
            token: tokenInfo.symbol,
            tokenAddress: tokenAddr,
            spender: spenderAddr,
            spenderName: spenderInfo.name,
            spenderVerified: spenderInfo.verified,
            amount: allowance.toString(),
            amountFormatted: formatApprovalAmount(allowance, tokenInfo.decimals),
            isUnlimited,
            risk,
          });
        }
      } catch (error) {
        console.warn(`[WalletApprovals] Error checking ${tokenInfo.symbol} -> ${spenderAddr}:`, error);
        // Continue checking other approvals
      }
    }
  }

  // Sort by risk (high first)
  const riskOrder: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };
  approvals.sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);

  const highRiskCount = approvals.filter(a => a.risk === 'high').length;

  console.log(`[WalletApprovals] Found ${approvals.length} approvals, ${highRiskCount} high risk`);

  const warnings: Warning[] = [];
  if (highRiskCount > 0) {
    warnings.push({
      level: 'danger',
      message: `Tenes ${highRiskCount} approval${highRiskCount > 1 ? 's' : ''} de alto riesgo`,
    });
  }

  return {
    success: true,
    data: {
      wallet: address,
      totalApprovals: approvals.length,
      highRiskCount,
      approvals,
    },
    warnings,
    limitations: CAPABILITIES_META['wallet-approvals'].limitations,
  };
}

/**
 * Mock data for demo when RPC is unavailable
 */
function getMockApprovals(address: string): CapabilityResult<WalletApprovalsData> {
  const mockApprovals: ApprovalInfo[] = [
    {
      token: 'USDC',
      tokenAddress: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
      spender: '0x145863eb42cf62847a6ca784e6416c1682b1b2ae',
      spenderName: 'VVS Finance Router',
      spenderVerified: true,
      amount: MaxUint256.toString(),
      amountFormatted: 'Unlimited',
      isUnlimited: true,
      risk: 'low',
    },
    {
      token: 'WCRO',
      tokenAddress: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
      spender: '0x0000000000000000000000000000000000000001',
      spenderName: 'Unknown',
      spenderVerified: false,
      amount: MaxUint256.toString(),
      amountFormatted: 'Unlimited',
      isUnlimited: true,
      risk: 'high',
    },
  ];

  console.log('[WalletApprovals] Returning mock data for demo');

  return {
    success: true,
    data: {
      wallet: address,
      totalApprovals: mockApprovals.length,
      highRiskCount: 1,
      approvals: mockApprovals,
    },
    warnings: [
      {
        level: 'info',
        message: 'Datos de ejemplo - conecta a Cronos para datos reales',
      },
      {
        level: 'danger',
        message: 'Tenes 1 approval de alto riesgo',
      },
    ],
    limitations: CAPABILITIES_META['wallet-approvals'].limitations,
  };
}

/**
 * Register the capability
 */
export function registerWalletApprovalsCapability(): void {
  registerCapability({
    ...CAPABILITIES_META['wallet-approvals'],
    inputSchema: walletApprovalsInputSchema,
    execute: executeWalletApprovals,
  });
}
