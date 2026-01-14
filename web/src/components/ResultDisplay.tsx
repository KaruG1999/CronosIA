import type {
  CapabilityResult,
  ContractScanData,
  WalletApprovalsData,
  TxSimulateData,
  RiskLevel,
  Warning,
} from '../types';

interface ResultDisplayProps {
  capability: string;
  result: CapabilityResult;
  paidAmount?: string;
}

// Capability display names
const CAPABILITY_NAMES: Record<string, string> = {
  'contract-scan': 'Contract Scan',
  'wallet-approvals': 'Wallet Approvals',
  'tx-simulate': 'Tx Simulate',
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    low: { label: 'Low Risk', className: 'badge-safe' },
    medium: { label: 'Medium Risk', className: 'badge-warning' },
    high: { label: 'High Risk', className: 'badge-danger' },
  };

  const { label, className } = config[level];
  return <span className={className}>{label}</span>;
}

function WarningsList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Warnings ({warnings.length})
      </p>
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`
            p-3 rounded-lg text-sm
            ${
              warning.level === 'danger'
                ? 'bg-status-danger/5 border border-status-danger/20 text-status-danger'
                : warning.level === 'warning'
                ? 'bg-status-warning/5 border border-status-warning/20 text-status-warning'
                : 'bg-accent/5 border border-accent/20 text-accent'
            }
          `}
        >
          {warning.message}
        </div>
      ))}
    </div>
  );
}

function LimitationsSection({ limitations }: { limitations: string[] }) {
  if (limitations.length === 0) {
    limitations = [
      'This analysis is informational only.',
      'Verify with official sources before making decisions.',
    ];
  }

  return (
    <div className="mt-5 pt-4 border-t border-surface-border">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
        Limitations
      </p>
      <ul className="space-y-1">
        {limitations.map((limitation, index) => (
          <li key={index} className="text-xs text-text-secondary flex items-start gap-2">
            <span className="text-text-tertiary">•</span>
            <span>{limitation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HighRiskAlert({ message }: { message: string }) {
  return (
    <div className="bg-status-danger/5 border border-status-danger/20 rounded-lg p-4 mb-4">
      <p className="font-semibold text-status-danger text-sm">High Risk Detected</p>
      <p className="text-xs text-status-danger/80 mt-1">{message}</p>
    </div>
  );
}

function ContractScanResult({ data }: { data: ContractScanData }) {
  const shortAddress = `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;

  if (!data.isContract) {
    return (
      <div className="bg-surface-hover rounded-lg p-4">
        <p className="font-medium text-text-primary text-sm">Not a Contract</p>
        <p className="text-xs text-text-secondary mt-1">
          This address is a regular wallet (EOA), not a smart contract.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.riskLevel === 'high' && (
        <HighRiskAlert message="Multiple risk signals detected. Verify before interacting." />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
        <div>
          <p className="text-xs text-text-tertiary">Contract</p>
          <p className="font-mono text-sm text-text-primary">{shortAddress}</p>
        </div>
        <RiskBadge level={data.riskLevel} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Verified</p>
          <p className={`text-sm font-medium ${data.verified ? 'text-status-safe' : 'text-status-warning'}`}>
            {data.verified ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Age</p>
          <p className="text-sm font-medium text-text-primary">{data.ageDays} days</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Transactions</p>
          <p className="text-sm font-medium text-text-primary">{data.txCount.toLocaleString()}</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Proxy</p>
          <p className="text-sm font-medium text-text-primary">{data.isProxy ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Signals */}
      {data.signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Signals ({data.signals.length})
          </p>
          {data.signals.map((signal, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg text-xs ${
                signal.type === 'warning'
                  ? 'bg-status-warning/5 text-status-warning'
                  : 'bg-accent/5 text-accent'
              }`}
            >
              {signal.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WalletApprovalsResult({ data }: { data: WalletApprovalsData }) {
  const shortWallet = `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}`;

  return (
    <div className="space-y-4">
      {data.highRiskCount > 0 && (
        <HighRiskAlert
          message={`${data.highRiskCount} high-risk approval${data.highRiskCount > 1 ? 's' : ''} found.`}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-surface-hover rounded-lg">
        <div>
          <p className="text-xs text-text-tertiary">Wallet</p>
          <p className="font-mono text-sm text-text-primary">{shortWallet}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-tertiary">Total</p>
          <p className="text-lg font-semibold text-text-primary">{data.totalApprovals}</p>
        </div>
      </div>

      {/* Approvals list */}
      {data.approvals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            Active Approvals
          </p>
          {data.approvals.map((approval, index) => (
            <div
              key={index}
              className={`bg-surface-hover rounded-lg p-3 border-l-2 ${
                approval.risk === 'high'
                  ? 'border-status-danger'
                  : approval.risk === 'medium'
                  ? 'border-status-warning'
                  : 'border-status-safe'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-text-primary">{approval.token}</span>
                <RiskBadge level={approval.risk} />
              </div>
              <p className="text-xs text-text-secondary">
                Spender: {approval.spenderName}
              </p>
              <p className="text-xs text-accent mt-1">
                Amount: {approval.amountFormatted}
                {approval.isUnlimited && (
                  <span className="text-status-danger ml-1">(Unlimited)</span>
                )}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-status-safe/5 border border-status-safe/20 rounded-lg text-center">
          <p className="text-status-safe text-sm font-medium">No active approvals</p>
        </div>
      )}
    </div>
  );
}

function TxSimulateResult({ data }: { data: TxSimulateData }) {
  const highImpact = data.priceImpactPercent > 1;

  return (
    <div className="space-y-4">
      {highImpact && (
        <div className="bg-status-warning/5 border border-status-warning/20 rounded-lg p-4">
          <p className="font-semibold text-status-warning text-sm">
            High Price Impact: {data.priceImpactPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-status-warning/80 mt-1">
            Consider splitting the trade into smaller amounts.
          </p>
        </div>
      )}

      {/* Swap summary */}
      <div className="bg-surface-hover rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-lg font-semibold text-text-primary">{data.input.amountFormatted}</p>
            <p className="text-xs text-text-secondary">You send</p>
          </div>
          <span className="text-xl text-accent">&rarr;</span>
          <div>
            <p className="text-lg font-semibold text-status-safe">{data.output.amountFormatted}</p>
            <p className="text-xs text-text-secondary">You receive</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">DEX</p>
          <p className="text-sm font-medium text-text-primary">{data.dex}</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Price Impact</p>
          <p className={`text-sm font-medium ${highImpact ? 'text-status-warning' : 'text-text-primary'}`}>
            {data.priceImpactPercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Route</p>
          <p className="text-xs font-medium text-text-primary">{data.route.join(' → ')}</p>
        </div>
        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-xs text-text-tertiary">Est. Gas</p>
          <p className="text-sm font-medium text-text-primary">{data.estimatedGas}</p>
        </div>
      </div>
    </div>
  );
}

export function ResultDisplay({ capability, result, paidAmount }: ResultDisplayProps) {
  const capabilityName = CAPABILITY_NAMES[capability] || capability;

  const renderResult = () => {
    switch (capability) {
      case 'contract-scan':
        return <ContractScanResult data={result.data as ContractScanData} />;
      case 'wallet-approvals':
        return <WalletApprovalsResult data={result.data as WalletApprovalsData} />;
      case 'tx-simulate':
        return <TxSimulateResult data={result.data as TxSimulateData} />;
      default:
        return (
          <pre className="text-xs text-text-secondary overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
        <div>
          <p className="text-sm font-medium text-text-primary">{capabilityName}</p>
          <p className="text-xs text-text-tertiary">Analysis Result</p>
        </div>
        {paidAmount && (
          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
            Paid: {paidAmount}
          </span>
        )}
      </div>

      {/* Result content */}
      {renderResult()}

      {/* Warnings */}
      <WarningsList warnings={result.warnings} />

      {/* Limitations */}
      <LimitationsSection limitations={result.limitations} />
    </div>
  );
}
