// =========================================
// CronosAI Ops - Shared Types
// =========================================

/**
 * Warning levels for capability results
 */
export type WarningLevel = 'info' | 'warning' | 'danger';

/**
 * Risk levels for analysis results
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Warning object in capability results
 */
export interface Warning {
  level: WarningLevel;
  message: string;
}

/**
 * Signal detected during analysis
 */
export interface Signal {
  type: 'info' | 'warning';
  code: string;
  message: string;
  weight: number;
}

/**
 * Result from any capability execution
 */
export interface CapabilityResult<T = unknown> {
  success: boolean;
  data: T;
  warnings: Warning[];
  limitations: readonly string[];
}

/**
 * Capability definition
 */
export interface CapabilityDefinition {
  name: string;
  price: string;
  priceUSDC: number;
  description: string;
  limitations: readonly string[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  capability?: string;
  cost?: string;
  result?: T;
  error?: string;
  message?: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  services: {
    claude: boolean;
  };
}
