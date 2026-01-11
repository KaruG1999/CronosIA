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
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    low: { label: 'BAJO', class: 'badge-safe' },
    medium: { label: 'MEDIO', class: 'badge-warning' },
    high: { label: 'ALTO', class: 'badge-danger' },
  };

  const { label, class: className } = config[level];

  return <span className={className}>{label}</span>;
}

function WarningsList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {warnings.map((warning, index) => (
        <div
          key={index}
          className={`
            flex items-start gap-2 p-3 rounded-lg text-sm
            ${
              warning.level === 'danger'
                ? 'bg-status-danger/10 border border-status-danger/30 text-status-danger'
                : warning.level === 'warning'
                ? 'bg-status-warning/10 border border-status-warning/30 text-status-warning'
                : 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
            }
          `}
        >
          <span>
            {warning.level === 'danger'
              ? '⛔'
              : warning.level === 'warning'
              ? '⚠️'
              : 'ℹ️'}
          </span>
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  );
}

function Disclaimer({ limitations }: { limitations: string[] }) {
  return (
    <div className="mt-4 pt-4 border-t border-neon-cyan/10">
      <p className="text-xs text-text-secondary">
        ⚠️ {limitations[0] || 'Este analisis es orientativo, no garantiza seguridad.'}
      </p>
    </div>
  );
}

function ContractScanResult({ data }: { data: ContractScanData }) {
  const shortAddress = `${data.address.slice(0, 6)}...${data.address.slice(-4)}`;

  if (!data.isContract) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary">
          <span>ℹ️</span>
          <span>Esta direccion no es un contrato, es una wallet comun.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">Contrato</p>
          <p className="font-mono text-white">{shortAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Riesgo</p>
          <RiskBadge level={data.riskLevel} />
        </div>
      </div>

      {/* Risk alert for high risk */}
      {data.riskLevel === 'high' && (
        <div className="bg-status-danger/10 border border-status-danger/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-status-danger font-semibold mb-2">
            <span>⛔</span>
            <span>ATENCION: Senales de riesgo detectadas</span>
          </div>
          <p className="text-sm text-status-danger/80">
            Recomendamos verificar la legitimidad antes de interactuar.
          </p>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Verificado</p>
          <p className={data.verified ? 'text-status-safe' : 'text-status-warning'}>
            {data.verified ? '✓ Si' : '✗ No'}
          </p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Antiguedad</p>
          <p className="text-white">{data.ageDays} dias</p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Transacciones</p>
          <p className="text-white">{data.txCount.toLocaleString()}</p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Es Proxy</p>
          <p className="text-white">{data.isProxy ? 'Si' : 'No'}</p>
        </div>
      </div>

      {/* Signals */}
      {data.signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">Senales detectadas:</p>
          {data.signals.map((signal, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-2 text-sm
                ${signal.type === 'warning' ? 'text-status-warning' : 'text-neon-cyan'}
              `}
            >
              <span>{signal.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <span>{signal.message}</span>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">Wallet</p>
          <p className="font-mono text-white">{shortWallet}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">Total Approvals</p>
          <p className="text-xl font-bold text-white">{data.totalApprovals}</p>
        </div>
      </div>

      {/* High risk alert */}
      {data.highRiskCount > 0 && (
        <div className="bg-status-danger/10 border border-status-danger/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-status-danger font-semibold">
            <span>⛔</span>
            <span>
              {data.highRiskCount} approval{data.highRiskCount > 1 ? 's' : ''} de alto riesgo
            </span>
          </div>
        </div>
      )}

      {/* Approvals list */}
      {data.approvals.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">Approvals activos:</p>
          {data.approvals.map((approval, index) => (
            <div
              key={index}
              className={`
                bg-cronos-deep/50 rounded-lg p-3 border-l-4
                ${
                  approval.risk === 'high'
                    ? 'border-status-danger'
                    : approval.risk === 'medium'
                    ? 'border-status-warning'
                    : 'border-status-safe'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{approval.token}</span>
                <RiskBadge level={approval.risk} />
              </div>
              <p className="text-sm text-text-secondary">
                → {approval.spenderName}
              </p>
              <p className="text-sm text-neon-cyan">{approval.amountFormatted}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-secondary">No se encontraron approvals activos.</p>
      )}
    </div>
  );
}

function TxSimulateResult({ data }: { data: TxSimulateData }) {
  const highImpact = data.priceImpactPercent > 1;

  return (
    <div className="space-y-4">
      {/* Swap summary */}
      <div className="bg-cronos-deep/50 rounded-lg p-4 text-center">
        <p className="text-sm text-text-secondary mb-2">Simulacion de Swap</p>
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{data.input.amountFormatted}</p>
          </div>
          <span className="text-2xl text-neon-cyan">→</span>
          <div>
            <p className="text-2xl font-bold text-status-safe">{data.output.amountFormatted}</p>
          </div>
        </div>
      </div>

      {/* High price impact warning */}
      {highImpact && (
        <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-status-warning font-semibold mb-1">
            <span>⚠️</span>
            <span>Price Impact Alto: {data.priceImpactPercent.toFixed(2)}%</span>
          </div>
          <p className="text-sm text-status-warning/80">
            Vas a recibir menos de lo esperado. Considera dividir la operacion.
          </p>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">DEX</p>
          <p className="text-white">{data.dex}</p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Price Impact</p>
          <p className={highImpact ? 'text-status-warning' : 'text-white'}>
            {data.priceImpactPercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Ruta</p>
          <p className="text-white">{data.route.join(' → ')}</p>
        </div>
        <div className="bg-cronos-deep/50 rounded-lg p-3">
          <p className="text-text-secondary">Gas Estimado</p>
          <p className="text-white">{data.estimatedGas}</p>
        </div>
      </div>
    </div>
  );
}

export function ResultDisplay({ capability, result }: ResultDisplayProps) {
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
          <pre className="text-sm text-text-secondary overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="card">
      {/* Agent avatar */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neon-cyan/10">
        <img
          src="/images/LogoSinFondo.png"
          alt="CronosIA"
          className="w-8 h-8 object-contain"
        />
        <span className="text-sm font-medium text-neon-cyan">CronosIA Agent</span>
      </div>

      {/* Result content */}
      {renderResult()}

      {/* Warnings */}
      <WarningsList warnings={result.warnings} />

      {/* Disclaimer */}
      <Disclaimer limitations={result.limitations} />
    </div>
  );
}
