// Capability types
export type CapabilitySlug = 'contract-scan' | 'wallet-approvals' | 'tx-simulate';

export interface CapabilityInfo {
  slug: CapabilitySlug;
  name: string;
  description: string;
  price: string;
  priceUSDC: number;
  icon: string;
  placeholder: string;
}

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high';

// Warning types
export interface Warning {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

// Signal from analysis
export interface Signal {
  type: 'info' | 'warning';
  code: string;
  message: string;
  weight: number;
}

// Contract Scan Result
export interface ContractScanData {
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

// Wallet Approvals Result
export interface ApprovalInfo {
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

export interface WalletApprovalsData {
  wallet: string;
  totalApprovals: number;
  highRiskCount: number;
  approvals: ApprovalInfo[];
}

// Tx Simulate Result
export interface TxSimulateData {
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

// API Response
export interface CapabilityResult<T = unknown> {
  success: boolean;
  data: T;
  warnings: Warning[];
  limitations: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  capability: string;
  cost: string;
  result: CapabilityResult<T>;
  formattedResponse: string;
  processingTimeMs: number;
}

// Chat message types
export type MessageType = 'user' | 'system' | 'result' | 'error' | 'loading';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  capability?: CapabilitySlug;
  result?: CapabilityResult;
  timestamp: Date;
}
