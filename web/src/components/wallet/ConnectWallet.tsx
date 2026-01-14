import { useState } from 'react';
import { useWallet, walletConnectProjectId } from '../../lib/wallet';

interface ConnectWalletProps {
  compact?: boolean;
}

export function ConnectWallet({ compact = false }: ConnectWalletProps) {
  const [showOptions, setShowOptions] = useState(false);

  const {
    status,
    shortAddress,
    isConnecting,
    defaultChain,
    connectInjected,
    connectWalletConnect,
    disconnect,
    switchToDefaultNetwork,
    hasWalletConnect,
  } = useWallet();

  const handleDisconnect = () => {
    disconnect();
  };

  // Render the wallet options modal (used in both compact and full modes)
  const renderOptionsModal = () => {
    if (!showOptions) return null;

    if (status === 'disconnected') {
      return (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-primary">Connect Wallet</h3>
              <button onClick={() => setShowOptions(false)} className="text-text-tertiary hover:text-text-secondary">
                &times;
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => { connectInjected(); setShowOptions(false); }}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 p-3 bg-surface-hover hover:bg-surface-border/50 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold text-sm">W</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">Browser Wallet</p>
                  <p className="text-xs text-text-tertiary">
                    {typeof window !== 'undefined' && window.ethereum ? 'MetaMask, Crypto.com, etc.' : 'Click to install MetaMask'}
                  </p>
                </div>
              </button>
              {hasWalletConnect && walletConnectProjectId ? (
                <button
                  onClick={() => { connectWalletConnect(); setShowOptions(false); }}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 p-3 bg-surface-hover hover:bg-surface-border/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 font-bold text-sm">W</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">WalletConnect</p>
                    <p className="text-xs text-text-tertiary">Mobile & desktop wallets</p>
                  </div>
                </button>
              ) : (
                <div className="w-full flex items-center gap-3 p-3 bg-surface-hover/50 rounded-lg opacity-50">
                  <div className="w-8 h-8 bg-surface-border rounded-lg flex items-center justify-center text-text-tertiary font-bold text-sm">W</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-tertiary">WalletConnect</p>
                    <p className="text-xs text-text-tertiary">Not configured</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-4 text-center">Connecting to {defaultChain.name}</p>
          </div>
        </>
      );
    }

    if (status === 'connected') {
      return (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated p-3 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-border">
              <div className="w-2 h-2 rounded-full bg-status-safe" />
              <span className="text-xs text-text-secondary">{defaultChain.name}</span>
            </div>
            <p className="font-mono text-sm text-text-primary mb-3">{shortAddress}</p>
            <button onClick={() => { handleDisconnect(); setShowOptions(false); }} className="btn-secondary text-xs w-full">
              Disconnect
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  // Compact mode: just show status pill
  if (compact) {
    return (
      <div className="relative">
        {status === 'disconnected' && (
          <button onClick={() => setShowOptions(true)} className="btn-secondary text-xs px-3 py-1.5">
            Connect
          </button>
        )}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-md">
            <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-text-secondary">Connecting...</span>
          </div>
        )}
        {status === 'wrong-network' && (
          <button onClick={switchToDefaultNetwork} className="flex items-center gap-2 px-3 py-1.5 bg-status-warning/10 rounded-md text-xs text-status-warning">
            Wrong Network
          </button>
        )}
        {status === 'connected' && (
          <button onClick={() => setShowOptions(true)} className="flex items-center gap-2 px-3 py-1.5 bg-status-safe/10 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-status-safe" />
            <span className="text-xs text-status-safe font-mono">{shortAddress}</span>
          </button>
        )}
        {renderOptionsModal()}
      </div>
    );
  }

  // Full mode with options
  return (
    <div className="relative">
      {/* Status button */}
      {status === 'disconnected' && !showOptions && (
        <button
          onClick={() => setShowOptions(true)}
          className="btn-primary text-sm"
        >
          Connect Wallet
        </button>
      )}

      {status === 'connecting' && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-elevated rounded-lg">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Connecting...</span>
        </div>
      )}

      {status === 'wrong-network' && (
        <div className="bg-surface-elevated border border-surface-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-status-warning" />
            <span className="text-sm font-medium text-status-warning">Wrong Network</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Please switch to {defaultChain.name} (Chain ID: {defaultChain.id})
          </p>
          <div className="flex gap-2">
            <button
              onClick={switchToDefaultNetwork}
              className="btn-primary text-xs flex-1"
            >
              Switch Network
            </button>
            <button
              onClick={handleDisconnect}
              className="btn-secondary text-xs"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="bg-surface-elevated border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-safe" />
              <span className="text-sm font-medium text-text-primary">Connected</span>
            </div>
            <span className="text-xs text-text-secondary">{defaultChain.name}</span>
          </div>
          <p className="font-mono text-sm text-accent mb-3">{shortAddress}</p>
          <button
            onClick={handleDisconnect}
            className="btn-secondary text-xs w-full"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Connection options modal */}
      {showOptions && status === 'disconnected' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />

          {/* Options panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-text-primary">Connect Wallet</h3>
              <button
                onClick={() => setShowOptions(false)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2">
              {/* Browser Extension Wallets */}
              <button
                onClick={() => {
                  connectInjected();
                  setShowOptions(false);
                }}
                disabled={isConnecting}
                className="w-full flex items-center gap-3 p-3 bg-surface-hover hover:bg-surface-border/50 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent font-bold text-sm">
                  W
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Browser Wallet
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {typeof window !== 'undefined' && window.ethereum
                      ? 'MetaMask, Crypto.com, etc.'
                      : 'Click to install MetaMask'}
                  </p>
                </div>
              </button>

              {/* WalletConnect */}
              {hasWalletConnect && walletConnectProjectId ? (
                <button
                  onClick={() => {
                    connectWalletConnect();
                    setShowOptions(false);
                  }}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 p-3 bg-surface-hover hover:bg-surface-border/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 font-bold text-sm">
                    W
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">WalletConnect</p>
                    <p className="text-xs text-text-tertiary">Mobile & desktop wallets</p>
                  </div>
                </button>
              ) : (
                <div className="w-full flex items-center gap-3 p-3 bg-surface-hover/50 rounded-lg opacity-50">
                  <div className="w-8 h-8 bg-surface-border rounded-lg flex items-center justify-center text-text-tertiary font-bold text-sm">
                    W
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-tertiary">WalletConnect</p>
                    <p className="text-xs text-text-tertiary">Not configured</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-text-tertiary mt-4 text-center">
              Connecting to {defaultChain.name}
            </p>
          </div>
        </>
      )}

      {/* Connected dropdown */}
      {showOptions && status === 'connected' && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-surface-elevated border border-surface-border rounded-xl shadow-elevated p-3 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-border">
              <div className="w-2 h-2 rounded-full bg-status-safe" />
              <span className="text-xs text-text-secondary">{defaultChain.name}</span>
            </div>
            <p className="font-mono text-sm text-text-primary mb-3">{shortAddress}</p>
            <button
              onClick={() => {
                handleDisconnect();
                setShowOptions(false);
              }}
              className="btn-secondary text-xs w-full"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
