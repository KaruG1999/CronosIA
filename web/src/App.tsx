import { useState, useCallback } from 'react';
import { Header, type NetworkInfo } from './components/Header';
import { ChatInterface } from './components/ChatInterface';

function App() {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);

  const handleNetworkChange = useCallback((net: NetworkInfo | null) => {
    setNetwork(net);
  }, []);

  // Calculate header height based on banner visibility
  const hasBanner = network?.isMainnet || network?.isTestnet;
  const headerHeight = hasBanner ? 'pt-[84px]' : 'pt-14';

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      {/* Header */}
      <Header onNetworkChange={handleNetworkChange} />

      {/* Main content */}
      <main className={`${headerHeight} flex-1 flex flex-col`}>
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 flex flex-col">
          <div className="flex-1 bg-surface-elevated border border-surface-border rounded-xl overflow-hidden flex flex-col">
            <ChatInterface network={network} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface-base">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-tertiary">
            <p>
              Informational analysis only. Verify with official sources.
            </p>
            <div className="flex items-center gap-3">
              <span>x402 Protocol</span>
              <span className="text-surface-border">|</span>
              <span>Cronos Network</span>
              {network && (
                <>
                  <span className="text-surface-border">|</span>
                  <span className={network.isMainnet ? 'text-status-danger' : 'text-status-safe'}>
                    {network.isMainnet ? 'Mainnet' : 'Testnet'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
