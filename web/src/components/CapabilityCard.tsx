import { useState } from 'react';
import type { CapabilityInfo } from '../types';

interface CapabilityCardProps {
  capability: CapabilityInfo;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}

// Capability includes/features
const CAPABILITY_INCLUDES: Record<string, string[]> = {
  'contract-scan': [
    'Explorer verification status',
    'Contract age & activity signals',
    'Proxy detection',
    'Risk score calculation',
  ],
  'wallet-approvals': [
    'Active token spenders',
    'Unlimited approval detection',
    'Risk flags per approval',
    'Spender verification',
  ],
  'tx-simulate': [
    'Expected output amount',
    'Price impact analysis',
    'DEX route visualization',
    'Gas estimation',
  ],
};

export function CapabilityCard({
  capability,
  selected,
  onClick,
  disabled = false,
  highlight = false,
}: CapabilityCardProps) {
  const [showIncludes, setShowIncludes] = useState(false);
  const includes = CAPABILITY_INCLUDES[capability.slug] || [];

  return (
    <div className="relative">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowIncludes(true)}
        onMouseLeave={() => setShowIncludes(false)}
        onFocus={() => setShowIncludes(true)}
        onBlur={() => setShowIncludes(false)}
        className={`
          capability-card w-full text-left p-4 rounded-xl transition-all duration-200
          ${
            selected
              ? 'bg-surface-elevated border-2 border-accent'
              : highlight
                ? 'bg-surface-elevated border-2 border-accent/50 ring-2 ring-accent/20'
                : 'bg-surface-elevated/50 border border-surface-border hover:border-text-tertiary hover:bg-surface-hover'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30
        `}
        aria-pressed={selected}
        aria-label={`${capability.name} - ${capability.price}`}
      >
        <div className="flex items-start gap-3">
          {/* Icon - reduced prominence */}
          <div
            className={`
              text-xl w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              transition-colors duration-200
              ${selected ? 'bg-accent/10' : 'bg-surface-hover'}
            `}
          >
            {capability.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-medium text-text-primary truncate text-sm">
                {capability.name}
              </h3>
              <span
                className={`
                  text-sm font-semibold whitespace-nowrap px-2.5 py-0.5 rounded-md
                  transition-colors duration-200
                  ${
                    selected
                      ? 'bg-accent text-white'
                      : 'bg-accent/10 text-accent'
                  }
                `}
              >
                {capability.price}
              </span>
            </div>
            <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
              {capability.description}
            </p>
          </div>
        </div>

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-3 right-3">
            <span className="text-accent text-sm">&#10003;</span>
          </div>
        )}
      </button>

      {/* Includes tooltip - solid background, high z-index */}
      {showIncludes && includes.length > 0 && (
        <div
          className="absolute z-[100] left-0 right-0 mt-2 p-4 rounded-xl shadow-elevated animate-fadeIn"
          style={{ backgroundColor: '#1a1a1d', border: '1px solid #262629' }}
          role="tooltip"
        >
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
            Includes
          </p>
          <ul className="space-y-1.5">
            {includes.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-status-safe text-xs">&#10003;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Capabilities data - Professional tone
export const CAPABILITIES: CapabilityInfo[] = [
  {
    slug: 'contract-scan',
    name: 'Contract Scan',
    description: 'Analyze contract verification, age, and activity patterns.',
    price: '$0.01',
    priceUSDC: 0.01,
    icon: '1',
    placeholder: 'Contract address (0x...)',
  },
  {
    slug: 'wallet-approvals',
    name: 'Wallet Approvals',
    description: 'Review active token approvals and identify risky spenders.',
    price: '$0.02',
    priceUSDC: 0.02,
    icon: '2',
    placeholder: 'Wallet address (0x...)',
  },
  {
    slug: 'tx-simulate',
    name: 'Tx Simulate',
    description: 'Preview swap output, price impact, and routing.',
    price: '$0.03',
    priceUSDC: 0.03,
    icon: '3',
    placeholder: 'e.g. 100 CRO to USDC',
  },
];
