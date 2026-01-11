// =========================================
// CronosAI Ops - Transaction Simulate Capability
// =========================================

import { z } from 'zod';
import { Contract, parseUnits, formatUnits } from 'ethers';
import { registerCapability, CAPABILITIES_META } from './index.js';
import { getProvider } from '../../services/blockchain.js';
import { config } from '../../shared/config.js';
import { CapabilityError } from '../../shared/errors.js';
import type { CapabilityResult, Warning } from '../../shared/types.js';

/**
 * Input schema with strict validation
 */
const txSimulateInputSchema = z.object({
  action: z.enum(['swap']),
  params: z.object({
    token_in: z.string().min(1, 'Token in is required'),
    token_out: z.string().min(1, 'Token out is required'),
    amount: z.number().positive('Amount must be positive'),
  }),
});

type TxSimulateInput = z.infer<typeof txSimulateInputSchema>;

/**
 * Token info for simulation
 */
interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

/**
 * Simulation result structure
 */
interface SimulationData {
  action: string;
  input: {
    token: string;
    amount: number;
    amountFormatted: string;
  };
  output: {
    token: string;
    amount: string;
    amountFormatted: string;
  };
  executionPrice: number;
  priceImpactPercent: number;
  route: string[];
  dex: string;
  estimatedGas: string;
}

/**
 * Supported tokens on Cronos
 */
const TOKENS: Record<string, TokenInfo> = {
  CRO: {
    symbol: 'CRO',
    name: 'Cronos',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // WCRO
    decimals: 18,
  },
  WCRO: {
    symbol: 'WCRO',
    name: 'Wrapped CRO',
    address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
    decimals: 18,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    address: '0x66e428c3f67a68878562e79A0234c1F83c208770',
    decimals: 6,
  },
  VVS: {
    symbol: 'VVS',
    name: 'VVS Finance',
    address: '0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03',
    decimals: 18,
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xF2001B145b43032AAF5Ee2884e456CCd805F677D',
    decimals: 18,
  },
};

// VVS Router ABI (minimal for getAmountsOut)
const VVS_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function factory() external pure returns (address)',
];

// VVS Factory ABI (for pair lookup)
const VVS_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

/**
 * Resolve token symbol to TokenInfo
 */
function resolveToken(symbolOrAddress: string): TokenInfo | null {
  // Check by symbol (case-insensitive)
  const upperSymbol = symbolOrAddress.toUpperCase();
  if (TOKENS[upperSymbol]) {
    return TOKENS[upperSymbol];
  }

  // Check by address
  for (const token of Object.values(TOKENS)) {
    if (token.address.toLowerCase() === symbolOrAddress.toLowerCase()) {
      return token;
    }
  }

  return null;
}

/**
 * Get amounts out from VVS Router
 */
async function getAmountsOut(
  amountIn: bigint,
  path: string[]
): Promise<bigint[]> {
  const provider = getProvider();
  const router = new Contract(config.vvsRouterAddress, VVS_ROUTER_ABI, provider);

  try {
    const amounts = await router.getFunction('getAmountsOut')(amountIn, path) as bigint[];
    return amounts.map((a: bigint) => a);
  } catch (error) {
    console.error('[TxSimulate] getAmountsOut error:', error);
    throw error;
  }
}

/**
 * Check if pair exists on VVS
 */
async function pairExists(tokenA: string, tokenB: string): Promise<boolean> {
  const provider = getProvider();
  const factory = new Contract(config.vvsFactoryAddress, VVS_FACTORY_ABI, provider);

  try {
    const pairAddress = await factory.getFunction('getPair')(tokenA, tokenB) as string;
    return pairAddress !== '0x0000000000000000000000000000000000000000';
  } catch {
    return false;
  }
}

/**
 * Get mock price for demo purposes
 */
function getMockPrice(tokenIn: string, tokenOut: string): number {
  const prices: Record<string, number> = {
    CRO: 0.098,
    WCRO: 0.098,
    USDC: 1.0,
    USDT: 1.0,
    DAI: 1.0,
    VVS: 0.000012,
  };

  const priceIn = prices[tokenIn] ?? 1;
  const priceOut = prices[tokenOut] ?? 1;

  return priceIn / priceOut;
}

/**
 * Execute transaction simulation
 */
async function executeTxSimulate(
  input: TxSimulateInput
): Promise<CapabilityResult<SimulationData>> {
  console.log(`[TxSimulate] Simulating ${input.action}:`, input.params);

  if (input.action !== 'swap') {
    throw new CapabilityError(
      'Action not supported',
      'UNSUPPORTED_ACTION',
      'Por ahora solo soportamos simulacion de swaps',
      true
    );
  }

  const { token_in, token_out, amount } = input.params;

  // Resolve tokens
  const tokenIn = resolveToken(token_in);
  const tokenOut = resolveToken(token_out);

  if (!tokenIn) {
    throw new CapabilityError(
      'Token not found',
      'TOKEN_NOT_FOUND',
      `Token '${token_in}' no soportado. Tokens disponibles: ${Object.keys(TOKENS).join(', ')}`,
      true
    );
  }

  if (!tokenOut) {
    throw new CapabilityError(
      'Token not found',
      'TOKEN_NOT_FOUND',
      `Token '${token_out}' no soportado. Tokens disponibles: ${Object.keys(TOKENS).join(', ')}`,
      true
    );
  }

  if (tokenIn.address === tokenOut.address) {
    throw new CapabilityError(
      'Same token',
      'SAME_TOKEN',
      'No podes intercambiar un token por si mismo',
      true
    );
  }

  // Try to get real quote from VVS
  let amountOut: bigint;
  let usedMock = false;

  const amountIn = parseUnits(amount.toString(), tokenIn.decimals);
  const path = [tokenIn.address, tokenOut.address];

  try {
    const provider = getProvider();
    await provider.getBlockNumber(); // Test connection

    // Check if direct pair exists, otherwise route through WCRO
    const directPairExists = await pairExists(tokenIn.address, tokenOut.address);

    let actualPath = path;
    const wcroToken = TOKENS['WCRO'];
    if (!directPairExists && tokenIn.symbol !== 'WCRO' && tokenOut.symbol !== 'WCRO' && wcroToken) {
      // Try routing through WCRO
      actualPath = [tokenIn.address, wcroToken.address, tokenOut.address];
      console.log('[TxSimulate] Using WCRO as intermediate');
    }

    const amounts = await getAmountsOut(amountIn, actualPath);
    const lastAmount = amounts[amounts.length - 1];
    if (lastAmount === undefined) {
      throw new Error('No amounts returned from router');
    }
    amountOut = lastAmount;
  } catch (error) {
    console.warn('[TxSimulate] VVS query failed, using mock data:', error);
    usedMock = true;

    // Calculate mock output
    const mockRate = getMockPrice(tokenIn.symbol, tokenOut.symbol);
    const mockOutput = amount * mockRate * 0.997; // 0.3% fee
    amountOut = parseUnits(mockOutput.toFixed(tokenOut.decimals), tokenOut.decimals);
  }

  // Calculate execution price and price impact
  const outputAmount = Number(formatUnits(amountOut, tokenOut.decimals));
  const executionPrice = outputAmount / amount;

  // Estimate price impact (simplified - in production would compare to spot price)
  const expectedRate = getMockPrice(tokenIn.symbol, tokenOut.symbol);
  const priceImpact = Math.abs((executionPrice - expectedRate) / expectedRate) * 100;

  // Generate warnings
  const warnings: Warning[] = [];

  if (usedMock) {
    warnings.push({
      level: 'info',
      message: 'Simulacion con datos estimados - conecta a Cronos para datos reales',
    });
  }

  if (priceImpact > 1) {
    warnings.push({
      level: 'warning',
      message: `Price impact alto: ${priceImpact.toFixed(2)}%. Considera reducir el monto.`,
    });
  }

  if (priceImpact > 5) {
    warnings.push({
      level: 'danger',
      message: `Price impact muy alto: ${priceImpact.toFixed(2)}%. Podrias perder valor significativo.`,
    });
  }

  if (amount > 10000 && (tokenIn.symbol === 'CRO' || tokenIn.symbol === 'WCRO')) {
    warnings.push({
      level: 'info',
      message: 'Para montos grandes, considera dividir la operacion',
    });
  }

  console.log(`[TxSimulate] Result: ${amount} ${tokenIn.symbol} -> ${outputAmount.toFixed(4)} ${tokenOut.symbol}`);

  return {
    success: true,
    data: {
      action: 'swap',
      input: {
        token: tokenIn.symbol,
        amount,
        amountFormatted: `${amount.toLocaleString()} ${tokenIn.symbol}`,
      },
      output: {
        token: tokenOut.symbol,
        amount: outputAmount.toFixed(tokenOut.decimals > 8 ? 8 : tokenOut.decimals),
        amountFormatted: `${outputAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tokenOut.symbol}`,
      },
      executionPrice,
      priceImpactPercent: priceImpact,
      route: [tokenIn.symbol, tokenOut.symbol],
      dex: 'VVS Finance',
      estimatedGas: '~150,000 gas',
    },
    warnings,
    limitations: CAPABILITIES_META['tx-simulate'].limitations,
  };
}

/**
 * Register the capability
 */
export function registerTxSimulateCapability(): void {
  registerCapability({
    ...CAPABILITIES_META['tx-simulate'],
    inputSchema: txSimulateInputSchema,
    execute: executeTxSimulate,
  });
}
