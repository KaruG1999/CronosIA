import { useState, useEffect } from 'react';
import { ConnectWallet } from './wallet';

interface NetworkInfo {
  mode: 'testnet' | 'mainnet';
  networkId: string;
  chainId: number;
  isTestnet: boolean;
  isMainnet: boolean;
  paymentToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  explorerUrl: string;
}

interface HeaderProps {
  onNetworkChange?: (network: NetworkInfo | null) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function Header({ onNetworkChange }: HeaderProps) {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNetwork() {
      try {
        const response = await fetch(`${API_BASE}/network`);
        if (!response.ok) throw new Error('Failed to fetch network info');

        const data = await response.json();
        setNetwork(data.network);
        onNetworkChange?.(data.network);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch network:', err);
        setError('Offline');
        onNetworkChange?.(null);
      } finally {
        setLoading(false);
      }
    }

    fetchNetwork();
  }, [onNetworkChange]);

  const isMainnet = network?.isMainnet ?? false;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-base/95 backdrop-blur-sm border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        {/* Logo - Text based */}
        <div className="flex items-center">
          <span className="text-base sm:text-lg font-bold text-white">
            Cronos<span className="text-accent">IA</span> Ops
          </span>
        </div>

        {/* Right side: Network Status */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Network badge - hidden on very small screens */}
          <div className="hidden xs:flex">
            {loading ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" />
                <span className="text-[10px] sm:text-xs text-text-tertiary">...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-status-danger" />
                <span className="text-[10px] sm:text-xs text-status-danger">{error}</span>
              </div>
            ) : (
              <div
                className={`
                  flex items-center gap-1.5 px-2 py-1 rounded-md
                  ${isMainnet ? 'bg-status-danger/10' : 'bg-status-safe/10'}
                `}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMainnet ? 'bg-status-danger' : 'bg-status-safe'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs font-medium ${
                    isMainnet ? 'text-status-danger' : 'text-status-safe'
                  }`}
                >
                  {isMainnet ? 'Mainnet' : 'Testnet'}
                </span>
              </div>
            )}
          </div>

          {/* Payment token - hidden on mobile */}
          {network && (
            <div className="hidden md:flex items-center px-2 py-1 bg-surface-elevated rounded-md">
              <span className="text-xs text-text-secondary">
                {network.paymentToken.symbol}
              </span>
            </div>
          )}

          {/* Wallet connection */}
          <ConnectWallet compact />
        </div>
      </div>

    </header>
  );
}

export type { NetworkInfo };
