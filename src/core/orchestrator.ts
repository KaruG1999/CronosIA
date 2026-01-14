// =========================================
// CronosAI Ops - Orchestrator
// =========================================

import { getCapability, hasCapability, type CapabilityInfo, getAllCapabilities } from './capabilities/index.js';
import { getClaudeClient } from './ai/claude.js';
import { SYSTEM_PROMPT, getResultPrompt, buildResultMessage } from './ai/prompts.js';
import { createError, Errors, CapabilityError } from '../shared/errors.js';
import { config } from '../shared/config.js';
import type { CapabilityResult } from '../shared/types.js';

/**
 * Response from executing a capability
 */
export interface OrchestratorResponse {
  success: boolean;
  capability: string;
  cost: string;
  rawResult: CapabilityResult;
  formattedResponse: string;
  processingTimeMs: number;
}

/**
 * Execute a capability with the given input
 */
export async function executeCapability(
  slug: string,
  input: unknown
): Promise<OrchestratorResponse> {
  const startTime = Date.now();

  console.log(`[Orchestrator] Executing capability: ${slug}`);

  // Check if capability exists
  if (!hasCapability(slug)) {
    throw createError(Errors.CAPABILITY_NOT_FOUND, `Capability '${slug}' not found`);
  }

  const capability = getCapability(slug);
  if (!capability) {
    throw createError(Errors.CAPABILITY_NOT_FOUND);
  }

  // Validate input with schema
  const parseResult = capability.inputSchema.safeParse(input);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    const errorMessage = firstError?.message ?? 'Invalid input';
    throw new CapabilityError(
      'Invalid input',
      'INVALID_INPUT',
      errorMessage,
      true
    );
  }

  // Execute capability
  let rawResult: CapabilityResult;
  try {
    rawResult = await capability.execute(parseResult.data);
  } catch (error) {
    if (error instanceof CapabilityError) {
      throw error;
    }
    console.error(`[Orchestrator] Capability execution error:`, error);
    throw createError(Errors.INTERNAL_ERROR);
  }

  // Format response with Claude (if API key is configured)
  let formattedResponse: string;
  try {
    formattedResponse = await formatWithClaude(slug, rawResult);
  } catch (error) {
    console.warn(`[Orchestrator] Claude formatting failed, using fallback:`, error);
    formattedResponse = formatFallback(slug, rawResult);
  }

  const processingTimeMs = Date.now() - startTime;

  console.log(`[Orchestrator] Completed in ${processingTimeMs}ms`);

  return {
    success: true,
    capability: slug,
    cost: capability.price,
    rawResult,
    formattedResponse,
    processingTimeMs,
  };
}

/**
 * Format result using Claude AI
 */
async function formatWithClaude(
  capability: string,
  result: CapabilityResult
): Promise<string> {
  // Skip Claude formatting if no API key
  if (!config.anthropicApiKey) {
    throw new Error('Claude API key not configured');
  }

  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `${getResultPrompt(capability)}\n\n${buildResultMessage(capability, result)}`,
      },
    ],
  });

  const content = response.content[0];
  if (content && content.type === 'text') {
    return content.text;
  }

  throw new Error('Empty response from Claude');
}

/**
 * Fallback formatting when Claude is not available
 */
function formatFallback(capability: string, result: CapabilityResult): string {
  const data = result.data as Record<string, unknown>;

  if (capability === 'contract-scan') {
    const isContract = data['isContract'] as boolean;
    if (!isContract) {
      return `This address is not a smart contract, it is a regular wallet (EOA).

If you wanted to analyze a contract, please verify the address is correct.`;
    }

    const riskLevel = data['riskLevel'] as string;
    const address = data['address'] as string;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const verified = data['verified'] as boolean;
    const ageDays = data['ageDays'] as number;
    const txCount = data['txCount'] as number;

    let response = `Analysis Complete

Contract: ${shortAddress}
Risk: ${riskLevel.toUpperCase()}

`;

    if (riskLevel === 'high') {
      response += `WARNING: Risk signals detected

`;
    }

    response += `Details:
- Verified: ${verified ? 'Yes' : 'No'}
- Age: ${ageDays} days
- Transactions: ${txCount}

`;

    if (result.warnings.length > 0) {
      response += `Warnings:\n`;
      for (const warning of result.warnings) {
        response += `- ${warning.message}\n`;
      }
      response += '\n';
    }

    response += `Reminder: ${result.limitations[0] ?? 'This analysis is informational only.'}`;

    return response;
  }

  if (capability === 'wallet-approvals') {
    const wallet = data['wallet'] as string;
    const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    const totalApprovals = data['totalApprovals'] as number;
    const highRiskCount = data['highRiskCount'] as number;
    const approvals = data['approvals'] as Array<{
      token: string;
      spenderName: string;
      amountFormatted: string;
      risk: string;
    }>;

    let response = `Approvals Analysis

Wallet: ${shortWallet}
Total approvals: ${totalApprovals}
`;

    if (highRiskCount > 0) {
      response += `WARNING: ${highRiskCount} high-risk approval${highRiskCount > 1 ? 's' : ''}

`;
    } else {
      response += '\n';
    }

    if (approvals.length > 0) {
      response += `Details:\n`;
      for (const approval of approvals) {
        const riskIcon = approval.risk === 'high' ? '!' : approval.risk === 'medium' ? '?' : '-';
        response += `[${riskIcon}] ${approval.token} -> ${approval.spenderName}: ${approval.amountFormatted}\n`;
      }
      response += '\n';
    } else {
      response += 'No active approvals found.\n\n';
    }

    if (result.warnings.length > 0) {
      for (const warning of result.warnings) {
        response += `${warning.message}\n`;
      }
      response += '\n';
    }

    response += `Reminder: ${result.limitations[0] ?? 'This analysis is informational only.'}`;

    return response;
  }

  if (capability === 'tx-simulate') {
    const input = data['input'] as { token: string; amountFormatted: string };
    const output = data['output'] as { token: string; amountFormatted: string };
    const priceImpact = data['priceImpactPercent'] as number;
    const dex = data['dex'] as string;
    const estimatedGas = data['estimatedGas'] as string;

    let response = `Swap Simulation

${input.amountFormatted} -> ${output.amountFormatted}

DEX: ${dex}
Price Impact: ${priceImpact.toFixed(2)}%
Estimated Gas: ${estimatedGas}

`;

    if (result.warnings.length > 0) {
      response += `Warnings:\n`;
      for (const warning of result.warnings) {
        response += `- ${warning.message}\n`;
      }
      response += '\n';
    }

    response += `Reminder: ${result.limitations[0] ?? 'This analysis is informational only.'}`;

    return response;
  }

  // Generic fallback
  return `Analysis Result:

${JSON.stringify(result.data, null, 2)}

${result.limitations[0] ?? 'This analysis is informational only.'}`;
}

/**
 * Get list of available capabilities
 */
export function getAvailableCapabilities(): CapabilityInfo[] {
  return getAllCapabilities();
}
