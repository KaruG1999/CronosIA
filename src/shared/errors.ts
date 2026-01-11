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
    'La direccion ingresada no es valida. Verifica que sea una direccion de Cronos (0x...)',
    true
  ),

  EXPLORER_TIMEOUT: new CapabilityError(
    'Explorer API timeout',
    'EXPLORER_TIMEOUT',
    'El servicio esta tardando mas de lo normal. Intenta de nuevo en unos segundos.',
    true
  ),

  CONTRACT_NOT_FOUND: new CapabilityError(
    'Contract not found',
    'CONTRACT_NOT_FOUND',
    'No encontre este contrato en Cronos. Verifica la direccion.',
    true
  ),

  TOKEN_NOT_FOUND: new CapabilityError(
    'Token not found',
    'TOKEN_NOT_FOUND',
    'No encontre este token. Verifica que sea un token soportado.',
    true
  ),

  CAPABILITY_NOT_FOUND: new CapabilityError(
    'Capability not found',
    'CAPABILITY_NOT_FOUND',
    'Esta capability no existe.',
    false
  ),

  CLAUDE_ERROR: new CapabilityError(
    'Claude API error',
    'CLAUDE_ERROR',
    'Hubo un problema con el servicio de IA. Intenta de nuevo.',
    true
  ),

  INTERNAL_ERROR: new CapabilityError(
    'Internal server error',
    'INTERNAL_ERROR',
    'Ocurrio un error inesperado. Intenta de nuevo.',
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
