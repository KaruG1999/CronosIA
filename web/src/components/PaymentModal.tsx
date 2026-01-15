import { useEffect, useRef } from 'react';
import type { CapabilityInfo } from '../types';
import type { NetworkInfo } from './Header';
import type { X402PaymentState } from '../hooks/useX402Payment';

// =========================================
// Types
// =========================================

interface PaymentModalProps {
  capability: CapabilityInfo;
  network: NetworkInfo | null;
  isOpen: boolean;
  paymentState: X402PaymentState;
  error?: string | null;
  txHash?: string | null;
  isWalletReady: boolean;
  isWalletLoading: boolean;
  onConfirmPayment: () => void;
  onCancel: () => void;
}

// =========================================
// Constants
// =========================================

// Capability action descriptions - factual tone
const CAPABILITY_ACTIONS: Record<string, string> = {
  'contract-scan':
    'Analyzes contract verification status, deployment age, transaction activity, and calculates a risk score.',
  'wallet-approvals':
    'Scans wallet for active token approvals, flags unlimited allowances, and identifies unverified spenders.',
  'tx-simulate':
    'Simulates swap transaction to display expected output, price impact percentage, and routing path.',
};

// Payment state to button text
const BUTTON_TEXT: Record<X402PaymentState, string> = {
  idle: 'Confirm & Pay',
  awaiting_approval: 'Confirm & Pay',
  opening_wallet: 'Opening Wallet...',
  signing: 'Sign in Wallet...',
  confirming: 'Confirming...',
  retrying_request: 'Finalizing...',
  settled: 'Complete!',
  error: 'Try Again',
};

// States where button should be disabled
const PROCESSING_STATES: X402PaymentState[] = [
  'opening_wallet',
  'signing',
  'confirming',
  'retrying_request',
];

// States where we show the spinner
const SPINNER_STATES: X402PaymentState[] = [
  'opening_wallet',
  'signing',
  'confirming',
  'retrying_request',
];

// =========================================
// Component
// =========================================

export function PaymentModal({
  capability,
  network,
  isOpen,
  paymentState,
  error,
  txHash,
  isWalletReady,
  isWalletLoading,
  onConfirmPayment,
  onCancel,
}: PaymentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const isProcessing = PROCESSING_STATES.includes(paymentState);
  // Disable button if wallet not ready or processing
  const isButtonDisabled = isProcessing || !isWalletReady;
  const showSpinner = SPINNER_STATES.includes(paymentState);

  // Focus trap and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    confirmButtonRef.current?.focus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  const actionDescription = CAPABILITY_ACTIONS[capability.slug] || '';
  const tokenSymbol = network?.paymentToken.symbol ?? 'devUSDC.e';

  // Get status message based on payment state
  const getStatusMessage = (): string | null => {
    switch (paymentState) {
      case 'opening_wallet':
        return 'Opening your wallet...';
      case 'signing':
        return 'Please confirm the transaction in your wallet';
      case 'confirming':
        return 'Waiting for blockchain confirmation...';
      case 'retrying_request':
        return 'Processing your request...';
      case 'settled':
        return 'Payment successful!';
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-base/90 backdrop-blur-sm"
        onClick={!isProcessing ? onCancel : undefined}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-xl shadow-elevated animate-fadeIn overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-surface-border">
          <h2
            id="payment-modal-title"
            className="text-base font-semibold text-text-primary"
          >
            Confirm Payment
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {capability.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Payment explanation - always show */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <p className="text-sm text-accent font-medium">
              Payment Required
            </p>
            <p className="text-xs text-text-secondary mt-1">
              This operation uses the x402 protocol. You will be asked to confirm
              the payment in your wallet.
            </p>
          </div>

          {/* Price display */}
          <div className="bg-surface-hover rounded-lg p-4 text-center">
            <p className="text-xs text-text-tertiary mb-1 uppercase tracking-wide">
              Cost
            </p>
            <p className="text-2xl font-semibold text-accent">
              {capability.price}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {tokenSymbol}
            </p>
          </div>

          {/* Action description */}
          <div className="space-y-1.5">
            <p className="text-xs text-text-tertiary uppercase tracking-wide">
              Operation
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {actionDescription}
            </p>
          </div>

          {/* Status message during processing */}
          {statusMessage && (
            <div className="bg-surface-hover rounded-lg p-3 flex items-center gap-3">
              {showSpinner && (
                <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              )}
              {paymentState === 'settled' && (
                <span className="text-status-safe text-lg">&#10003;</span>
              )}
              <p className="text-sm text-text-primary">{statusMessage}</p>
            </div>
          )}

          {/* Transaction hash after success */}
          {txHash && (
            <div className="bg-status-safe/5 border border-status-safe/20 rounded-lg p-3">
              <p className="text-xs text-status-safe font-medium mb-1">
                Transaction Confirmed
              </p>
              <a
                href={`${network?.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline break-all"
              >
                View on Explorer
              </a>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-status-danger/5 border border-status-danger/20 rounded-lg p-3">
              <p className="text-sm text-status-danger font-medium">
                Payment Failed
              </p>
              <p className="text-xs text-status-danger/80 mt-1">{error}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-surface-hover rounded-lg p-3">
            <p className="text-xs text-text-tertiary leading-relaxed">
              This analysis is informational only. Results should be verified
              with official sources before making financial decisions.
            </p>
          </div>
        </div>

        {/* Wallet status indicator */}
        {!isWalletReady && !isProcessing && (
          <div className="px-5 pb-2">
            <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-3 flex items-center gap-2">
              {isWalletLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-status-warning/30 border-t-status-warning rounded-full animate-spin" />
                  <span className="text-sm text-status-warning">Initializing wallet...</span>
                </>
              ) : (
                <>
                  <span className="text-status-warning">&#9888;</span>
                  <span className="text-sm text-status-warning">
                    Wallet not ready. Please ensure MetaMask is connected to Cronos Testnet.
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 border-t border-surface-border flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirmPayment}
            disabled={isButtonDisabled}
            className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
              !isWalletReady && !isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {showSpinner && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isWalletLoading && !showSpinner && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>
              {!isWalletReady && !isProcessing
                ? isWalletLoading
                  ? 'Waiting for wallet...'
                  : 'Wallet not ready'
                : BUTTON_TEXT[paymentState]}
            </span>
          </button>
        </div>

        {/* Network indicator */}
        <div className="px-5 pb-4 text-center">
          {network?.isTestnet ? (
            <p className="text-xs text-status-safe">
              Testnet: {tokenSymbol}
            </p>
          ) : network?.isMainnet ? (
            <p className="text-xs text-status-danger">
              Production: Real payment
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">x402 Protocol</p>
          )}
        </div>

        {/* Helpful links */}
        {network?.isTestnet && paymentState === 'error' && error?.includes('Insufficient') && (
          <div className="px-5 pb-4 text-center">
            <a
              href="https://cronos.org/faucet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              Get testnet tokens from faucet
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
