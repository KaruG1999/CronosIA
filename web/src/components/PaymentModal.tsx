import { useEffect, useRef } from 'react';
import type { CapabilityInfo } from '../types';
import type { NetworkInfo } from './Header';

interface PaymentModalProps {
  capability: CapabilityInfo;
  network: NetworkInfo | null;
  isOpen: boolean;
  isProcessing: boolean;
  error?: string | null;
  is402Error?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Capability action descriptions - factual tone
const CAPABILITY_ACTIONS: Record<string, string> = {
  'contract-scan':
    'Analyzes contract verification status, deployment age, transaction activity, and calculates a risk score.',
  'wallet-approvals':
    'Scans wallet for active token approvals, flags unlimited allowances, and identifies unverified spenders.',
  'tx-simulate':
    'Simulates swap transaction to display expected output, price impact percentage, and routing path.',
};

export function PaymentModal({
  capability,
  network,
  isOpen,
  isProcessing,
  error,
  is402Error,
  onConfirm,
  onCancel,
}: PaymentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

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
            {is402Error ? 'Payment Required' : 'Confirm Payment'}
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {capability.name}
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* 402 Error explanation */}
          {is402Error && (
            <div className="bg-status-warning/5 border border-status-warning/20 rounded-lg p-3">
              <p className="text-sm text-status-warning">
                x402: This operation requires payment to execute.
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Ensure you have {network?.paymentToken.symbol ?? 'USDCe'} in your connected wallet.
              </p>
            </div>
          )}

          {/* Price display */}
          <div className="bg-surface-hover rounded-lg p-4 text-center">
            <p className="text-xs text-text-tertiary mb-1 uppercase tracking-wide">
              Cost
            </p>
            <p className="text-2xl font-semibold text-accent">
              {capability.price}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {network?.paymentToken.symbol ?? 'USDCe'}
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

          {/* Disclaimer */}
          <div className="bg-surface-hover rounded-lg p-3">
            <p className="text-xs text-text-tertiary leading-relaxed">
              This analysis is informational only. Results should be verified
              with official sources before making financial decisions.
            </p>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-status-danger/5 border border-status-danger/20 rounded-lg p-3">
              <p className="text-sm text-status-danger">{error}</p>
            </div>
          )}
        </div>

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
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">&#9696;</span>
                <span>Processing...</span>
              </>
            ) : (
              <span>{is402Error ? 'Retry' : 'Confirm'}</span>
            )}
          </button>
        </div>

        {/* Network indicator */}
        <div className="px-5 pb-4 text-center">
          {network?.isTestnet ? (
            <p className="text-xs text-status-safe">
              Testnet: {network.paymentToken.symbol}
            </p>
          ) : network?.isMainnet ? (
            <p className="text-xs text-status-danger">
              Production: Real payment
            </p>
          ) : (
            <p className="text-xs text-text-tertiary">x402 Protocol</p>
          )}
        </div>
      </div>
    </div>
  );
}
