import type { CapabilityInfo } from '../types';

interface CapabilityCardProps {
  capability: CapabilityInfo;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function CapabilityCard({
  capability,
  selected,
  onClick,
  disabled = false,
}: CapabilityCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left p-4 rounded-xl transition-all duration-300
        ${
          selected
            ? 'bg-card-surface border-2 border-neon-cyan shadow-neon'
            : 'bg-card-surface/50 border border-neon-cyan/10 hover:border-neon-cyan/30 hover:shadow-neon'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            text-2xl w-12 h-12 rounded-lg flex items-center justify-center
            ${selected ? 'bg-neon-cyan/20' : 'bg-card-surface'}
          `}
        >
          {capability.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white truncate">
              {capability.name}
            </h3>
            <span
              className={`
                text-sm font-bold whitespace-nowrap px-2 py-0.5 rounded
                ${selected ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-card-surface text-neon-cyan'}
              `}
            >
              {capability.price}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
            {capability.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// Capabilities data
export const CAPABILITIES: CapabilityInfo[] = [
  {
    slug: 'contract-scan',
    name: 'Analizar Contrato',
    description: 'Escanea un contrato para detectar senales de riesgo',
    price: '$0.01',
    priceUSDC: 0.01,
    icon: '🔍',
    placeholder: 'Pega la direccion del contrato (0x...)',
  },
  {
    slug: 'wallet-approvals',
    name: 'Revisar Aprobaciones',
    description: 'Lista los token approvals activos de tu wallet',
    price: '$0.02',
    priceUSDC: 0.02,
    icon: '🛡️',
    placeholder: 'Pega la direccion de la wallet (0x...)',
  },
  {
    slug: 'tx-simulate',
    name: 'Simular Transaccion',
    description: 'Simula un swap para ver el resultado esperado',
    price: '$0.03',
    priceUSDC: 0.03,
    icon: '⚡',
    placeholder: 'ej: 100 CRO a USDC',
  },
];
