// =========================================
// CronosAI Ops - Contract Scan Capability
// =========================================

import { z } from 'zod';
import { registerCapability, CAPABILITIES_META } from './index.js';
import { getContractInfo } from '../../services/explorer.js';
import { isContract, isValidAddress } from '../../services/blockchain.js';
import { createError, Errors } from '../../shared/errors.js';
import type { CapabilityResult, Signal, RiskLevel, Warning } from '../../shared/types.js';

/**
 * Input schema with strict validation
 */
const contractScanInputSchema = z.object({
  address: z
    .string()
    .min(1, 'Address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

type ContractScanInput = z.infer<typeof contractScanInputSchema>;

/**
 * Output data structure
 */
interface ContractScanData {
  address: string;
  isContract: boolean;
  verified: boolean;
  contractName: string | null;
  ageDays: number;
  txCount: number;
  isProxy: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  signals: Signal[];
}

/**
 * Risk weight constants
 */
const RISK_WEIGHTS = {
  NOT_VERIFIED: 30,
  NEW_CONTRACT_7_DAYS: 25,
  NEW_CONTRACT_30_DAYS: 15,
  LOW_TX_COUNT: 15,
  VERY_LOW_TX_COUNT: 20,
  IS_PROXY: 5,
} as const;

/**
 * Calculate risk score from signals
 */
function calculateRiskScore(signals: Signal[]): number {
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);
  return Math.min(100, totalWeight);
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  return 'high';
}

/**
 * Analyze contract and generate signals
 */
function analyzeContract(
  address: string,
  verified: boolean,
  contractName: string | null,
  ageDays: number,
  txCount: number,
  isProxy: boolean
): Signal[] {
  const signals: Signal[] = [];

  // Check verification status
  if (!verified) {
    signals.push({
      type: 'warning',
      code: 'NOT_VERIFIED',
      message: 'Contract not verified on explorer',
      weight: RISK_WEIGHTS.NOT_VERIFIED,
    });
  }

  // Check contract age
  if (ageDays < 7) {
    signals.push({
      type: 'warning',
      code: 'NEW_CONTRACT',
      message: `Contract created ${ageDays} day${ageDays !== 1 ? 's' : ''} ago`,
      weight: RISK_WEIGHTS.NEW_CONTRACT_7_DAYS,
    });
  } else if (ageDays < 30) {
    signals.push({
      type: 'info',
      code: 'RECENT_CONTRACT',
      message: `Contract created ${ageDays} days ago`,
      weight: RISK_WEIGHTS.NEW_CONTRACT_30_DAYS,
    });
  }

  // Check transaction count
  if (txCount < 5) {
    signals.push({
      type: 'warning',
      code: 'VERY_LOW_ACTIVITY',
      message: `Only ${txCount} transaction${txCount !== 1 ? 's' : ''} recorded`,
      weight: RISK_WEIGHTS.VERY_LOW_TX_COUNT,
    });
  } else if (txCount < 50) {
    signals.push({
      type: 'info',
      code: 'LOW_ACTIVITY',
      message: `${txCount} transactions recorded`,
      weight: RISK_WEIGHTS.LOW_TX_COUNT,
    });
  }

  // Check if proxy (informational)
  if (isProxy) {
    signals.push({
      type: 'info',
      code: 'IS_PROXY',
      message: 'This is a proxy contract (upgradeable)',
      weight: RISK_WEIGHTS.IS_PROXY,
    });
  }

  // Add positive signals
  if (verified) {
    signals.push({
      type: 'info',
      code: 'VERIFIED',
      message: `Contract verified${contractName ? `: ${contractName}` : ''}`,
      weight: 0,
    });
  }

  if (ageDays >= 180) {
    signals.push({
      type: 'info',
      code: 'ESTABLISHED',
      message: `Contract active for ${ageDays} days`,
      weight: 0,
    });
  }

  if (txCount >= 1000) {
    signals.push({
      type: 'info',
      code: 'HIGH_ACTIVITY',
      message: `${txCount.toLocaleString()} transactions recorded`,
      weight: 0,
    });
  }

  return signals;
}

/**
 * Convert signals to warnings for result
 */
function signalsToWarnings(signals: Signal[]): Warning[] {
  return signals
    .filter(s => s.type === 'warning')
    .map(s => ({
      level: 'warning' as const,
      message: s.message,
    }));
}

/**
 * Execute contract scan
 */
async function executeContractScan(
  input: ContractScanInput
): Promise<CapabilityResult<ContractScanData>> {
  const { address } = input;

  console.log(`[ContractScan] Scanning ${address}`);

  // Validate address format
  if (!isValidAddress(address)) {
    throw createError(Errors.INVALID_ADDRESS);
  }

  // Check if it's actually a contract
  const contractCheck = await isContract(address);

  if (!contractCheck) {
    console.log(`[ContractScan] ${address} is not a contract`);
    return {
      success: true,
      data: {
        address,
        isContract: false,
        verified: false,
        contractName: null,
        ageDays: 0,
        txCount: 0,
        isProxy: false,
        riskScore: 0,
        riskLevel: 'low',
        signals: [],
      },
      warnings: [
        {
          level: 'info',
          message: 'This address is not a contract, it is a regular wallet (EOA)',
        },
      ],
      limitations: CAPABILITIES_META['contract-scan'].limitations,
    };
  }

  // Get contract info from explorer
  const explorerInfo = await getContractInfo(address);

  // Analyze and generate signals
  const signals = analyzeContract(
    address,
    explorerInfo.verified,
    explorerInfo.contractName,
    explorerInfo.ageDays,
    explorerInfo.txCount,
    explorerInfo.isProxy
  );

  // Calculate risk
  const riskScore = calculateRiskScore(signals);
  const riskLevel = getRiskLevel(riskScore);

  console.log(`[ContractScan] Result: riskLevel=${riskLevel}, riskScore=${riskScore}`);

  return {
    success: true,
    data: {
      address,
      isContract: true,
      verified: explorerInfo.verified,
      contractName: explorerInfo.contractName,
      ageDays: explorerInfo.ageDays,
      txCount: explorerInfo.txCount,
      isProxy: explorerInfo.isProxy,
      riskScore,
      riskLevel,
      signals,
    },
    warnings: signalsToWarnings(signals),
    limitations: CAPABILITIES_META['contract-scan'].limitations,
  };
}

/**
 * Register the capability
 */
export function registerContractScanCapability(): void {
  registerCapability({
    ...CAPABILITIES_META['contract-scan'],
    inputSchema: contractScanInputSchema,
    execute: executeContractScan,
  });
}
