// =========================================
// CronosAI Ops - Claude AI Client
// =========================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../shared/config.js';

let client: Anthropic | null = null;

/**
 * Get or create Claude client singleton
 */
export function getClaudeClient(): Anthropic {
  if (!client) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    client = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
  }
  return client;
}

/**
 * Test Claude connection
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const claude = getClaudeClient();
    const response = await claude.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    return response.content.length > 0;
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return false;
  }
}

/**
 * Simple completion for testing
 */
export async function complete(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    system?: string;
  } = {}
): Promise<string> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: options.model ?? 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens ?? 500,
    system: options.system,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content && content.type === 'text') {
    return content.text;
  }

  return '';
}
