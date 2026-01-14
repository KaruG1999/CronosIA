// =========================================
// CronosAI Ops - Custom Errors
// =========================================

/**
 * Base error for capability-related errors
 */
export class CapabilityError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'CapabilityError';
  }
}

/**
 * Predefined errors for common scenarios
 */
export const Errors = {
  INVALID_ADDRESS: new CapabilityError(
    'Invalid address format',
    'INVALID_ADDRESS',
    'The address entered is not valid. Please verify it is a Cronos address (0x...)',
    true
  ),

  EXPLORER_TIMEOUT: new CapabilityError(
    'Explorer API timeout',
    'EXPLORER_TIMEOUT',
    'The service is taking longer than usual. Please try again in a few seconds.',
    true
  ),

  CONTRACT_NOT_FOUND: new CapabilityError(
    'Contract not found',
    'CONTRACT_NOT_FOUND',
    'Could not find this contract on Cronos. Please verify the address.',
    true
  ),

  TOKEN_NOT_FOUND: new CapabilityError(
    'Token not found',
    'TOKEN_NOT_FOUND',
    'Could not find this token. Please verify it is a supported token.',
    true
  ),

  CAPABILITY_NOT_FOUND: new CapabilityError(
    'Capability not found',
    'CAPABILITY_NOT_FOUND',
    'This capability does not exist.',
    false
  ),

  CLAUDE_ERROR: new CapabilityError(
    'Claude API error',
    'CLAUDE_ERROR',
    'There was a problem with the AI service. Please try again.',
    true
  ),

  INTERNAL_ERROR: new CapabilityError(
    'Internal server error',
    'INTERNAL_ERROR',
    'An unexpected error occurred. Please try again.',
    true
  ),
} as const;

/**
 * Create a new error instance (since we can't reuse error instances)
 */
export function createError(
  template: CapabilityError,
  customMessage?: string
): CapabilityError {
  return new CapabilityError(
    template.message,
    template.code,
    customMessage ?? template.userMessage,
    template.recoverable
  );
}
