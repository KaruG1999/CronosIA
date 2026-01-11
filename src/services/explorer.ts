// =========================================
// CronosAI Ops - Cronos Explorer Service
// =========================================

import { config } from '../shared/config.js';
import { createError, Errors } from '../shared/errors.js';

/**
 * Contract info from Explorer API
 */
export interface ExplorerContractInfo {
  address: string;
  verified: boolean;
  contractName: string | null;
  compilerVersion: string | null;
  creationTxHash: string | null;
  creatorAddress: string | null;
  creationTimestamp: number | null;
  ageDays: number;
  txCount: number;
  isProxy: boolean;
}

/**
 * Raw response from Cronoscan API
 */
interface CronoscanResponse<T> {
  status: string;
  message: string;
  result: T;
}

interface SourceCodeResult {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  Proxy: string;
  Implementation: string;
}

interface TxListResult {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  isError: string;
}

interface ContractCreationResult {
  contractAddress: string;
  contractCreator: string;
  txHash: string;
}

const EXPLORER_TIMEOUT_MS = 10000;

/**
 * Make a request to Cronos Explorer API with timeout
 */
async function explorerFetch<T>(
  module: string,
  action: string,
  params: Record<string, string>
): Promise<T> {
  const url = new URL(config.cronosExplorerApi);
  url.searchParams.set('module', module);
  url.searchParams.set('action', action);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  if (config.cronosExplorerApiKey) {
    url.searchParams.set('apikey', config.cronosExplorerApiKey);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPLORER_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw createError(Errors.EXPLORER_TIMEOUT,
        `Explorer API responded with status ${response.status}`);
    }

    const data = await response.json() as CronoscanResponse<T>;

    // Cronoscan returns status "0" for errors or empty results
    if (data.status === '0' && data.message === 'NOTOK') {
      throw createError(Errors.EXPLORER_TIMEOUT, data.result as unknown as string);
    }

    return data.result;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError(Errors.EXPLORER_TIMEOUT);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if a contract is verified on Explorer
 */
async function isContractVerified(address: string): Promise<{
  verified: boolean;
  contractName: string | null;
  compilerVersion: string | null;
  isProxy: boolean;
}> {
  try {
    const result = await explorerFetch<SourceCodeResult[]>(
      'contract',
      'getsourcecode',
      { address }
    );

    const contract = result[0];
    if (!contract) {
      return {
        verified: false,
        contractName: null,
        compilerVersion: null,
        isProxy: false,
      };
    }

    // Contract is verified if SourceCode is not empty
    const verified = Boolean(contract.SourceCode && contract.SourceCode.length > 0);

    return {
      verified,
      contractName: verified ? contract.ContractName : null,
      compilerVersion: verified ? contract.CompilerVersion : null,
      isProxy: contract.Proxy === '1',
    };
  } catch {
    // If API fails, assume not verified (safe default)
    return {
      verified: false,
      contractName: null,
      compilerVersion: null,
      isProxy: false,
    };
  }
}

/**
 * Get contract creation info
 */
async function getContractCreation(address: string): Promise<{
  creatorAddress: string | null;
  creationTxHash: string | null;
  creationTimestamp: number | null;
}> {
  try {
    const result = await explorerFetch<ContractCreationResult[]>(
      'contract',
      'getcontractcreation',
      { contractaddresses: address }
    );

    const creation = result[0];
    if (!creation) {
      return {
        creatorAddress: null,
        creationTxHash: null,
        creationTimestamp: null,
      };
    }

    // Get timestamp from creation tx
    let creationTimestamp: number | null = null;
    if (creation.txHash) {
      try {
        const txList = await explorerFetch<TxListResult[]>(
          'account',
          'txlist',
          {
            address: creation.contractCreator,
            startblock: '0',
            endblock: '99999999',
            page: '1',
            offset: '100',
            sort: 'asc',
          }
        );

        const creationTx = txList.find(tx => tx.hash === creation.txHash);
        if (creationTx) {
          creationTimestamp = parseInt(creationTx.timeStamp, 10);
        }
      } catch {
        // Ignore timestamp fetch errors
      }
    }

    return {
      creatorAddress: creation.contractCreator,
      creationTxHash: creation.txHash,
      creationTimestamp,
    };
  } catch {
    return {
      creatorAddress: null,
      creationTxHash: null,
      creationTimestamp: null,
    };
  }
}

/**
 * Get transaction count for an address
 */
async function getTransactionCount(address: string): Promise<number> {
  try {
    const result = await explorerFetch<TxListResult[] | string>(
      'account',
      'txlist',
      {
        address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10000',
        sort: 'desc',
      }
    );

    if (typeof result === 'string') {
      return 0;
    }

    return result.length;
  } catch {
    return 0;
  }
}

/**
 * Calculate age in days from timestamp
 */
function calculateAgeDays(timestamp: number | null): number {
  if (!timestamp) return 0;

  const now = Math.floor(Date.now() / 1000);
  const ageSeconds = now - timestamp;
  return Math.floor(ageSeconds / 86400);
}

/**
 * Get complete contract info from Explorer
 */
export async function getContractInfo(address: string): Promise<ExplorerContractInfo> {
  console.log(`[Explorer] Fetching info for ${address}`);

  // Run queries in parallel for better performance
  const [verificationInfo, creationInfo, txCount] = await Promise.all([
    isContractVerified(address),
    getContractCreation(address),
    getTransactionCount(address),
  ]);

  const ageDays = calculateAgeDays(creationInfo.creationTimestamp);

  const info: ExplorerContractInfo = {
    address,
    verified: verificationInfo.verified,
    contractName: verificationInfo.contractName,
    compilerVersion: verificationInfo.compilerVersion,
    isProxy: verificationInfo.isProxy,
    creationTxHash: creationInfo.creationTxHash,
    creatorAddress: creationInfo.creatorAddress,
    creationTimestamp: creationInfo.creationTimestamp,
    ageDays,
    txCount,
  };

  console.log(`[Explorer] Contract info:`, {
    address,
    verified: info.verified,
    ageDays: info.ageDays,
    txCount: info.txCount,
  });

  return info;
}
