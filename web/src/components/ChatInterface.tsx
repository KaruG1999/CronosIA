import { useState, useRef, useEffect, useCallback } from 'react';
import { CapabilityCard, CAPABILITIES } from './CapabilityCard';
import { ResultDisplay } from './ResultDisplay';
import { LoadingAgent } from './LoadingAgent';
import { EmptyStateGuide } from './EmptyStateGuide';
import { PaymentModal } from './PaymentModal';
import {
  executeCapability,
  executeCapabilityWithPayment,
  parseSwapInput,
  extractAddress,
  isValidAddress,
  PaymentRequiredError,
  type CapabilityInput,
} from '../api/capabilities';
import {
  createX402PaymentHeader,
  type X402Challenge,
  type X402PaymentState,
} from '../hooks/useX402Payment';
import { useWallet } from '../lib/wallet';
import type { CapabilitySlug, CapabilityResult, CapabilityInfo } from '../types';
import type { NetworkInfo } from './Header';

// =========================================
// Types
// =========================================

// State machine states
type FlowState =
  | 'idle'
  | 'editing'
  | 'confirm_payment'
  | 'running'
  | 'result'
  | 'error';

interface Message {
  id: string;
  type: 'user' | 'result' | 'error' | 'loading';
  content?: string;
  capability?: CapabilitySlug;
  result?: CapabilityResult;
  paidAmount?: string;
}

interface ValidationState {
  isValid: boolean;
  error: string | null;
}

interface ChatInterfaceProps {
  network: NetworkInfo | null;
}

// =========================================
// Component
// =========================================

export function ChatInterface({ network }: ChatInterfaceProps) {
  // UI State
  const [selectedCapability, setSelectedCapability] = useState<CapabilityInfo | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    error: null,
  });
  const [highlightCapabilities, setHighlightCapabilities] = useState(false);

  // x402 Payment State
  const [x402Challenge, setX402Challenge] = useState<X402Challenge | null>(null);
  const [paymentState, setPaymentState] = useState<X402PaymentState>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<CapabilityInput | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capabilitySectionRef = useRef<HTMLDivElement>(null);

  // Wallet hook
  const { walletClient, isConnected, isCorrectNetwork, switchToDefaultNetwork } = useWallet();

  // =========================================
  // Effects
  // =========================================

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Validate input when it changes
  useEffect(() => {
    if (!selectedCapability || !inputValue.trim()) {
      setValidationState({ isValid: false, error: null });
      return;
    }

    const value = inputValue.trim();

    if (selectedCapability.slug === 'tx-simulate') {
      const parsed = parseSwapInput(value);
      if (!parsed) {
        setValidationState({
          isValid: false,
          error: 'Format: "100 CRO to USDC"',
        });
      } else {
        setValidationState({ isValid: true, error: null });
      }
    } else {
      const address = extractAddress(value);
      if (!address) {
        setValidationState({
          isValid: false,
          error: 'Enter a valid address (0x...)',
        });
      } else if (!isValidAddress(address)) {
        setValidationState({
          isValid: false,
          error: 'Invalid address format',
        });
      } else {
        setValidationState({ isValid: true, error: null });
      }
    }
  }, [inputValue, selectedCapability]);

  // =========================================
  // Message Helpers
  // =========================================

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  }, []);

  // =========================================
  // Handlers
  // =========================================

  const handleCapabilitySelect = useCallback((cap: CapabilityInfo) => {
    setSelectedCapability(cap);
    setFlowState('editing');
    setValidationState({ isValid: false, error: null });
    setInputValue('');
    // Reset payment state
    setX402Challenge(null);
    setPaymentState('idle');
    setPaymentError(null);
    setPaymentTxHash(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleScrollToCapabilities = useCallback(() => {
    capabilitySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightCapabilities(true);
    setTimeout(() => setHighlightCapabilities(false), 1500);
  }, []);

  const resetPaymentState = useCallback(() => {
    setX402Challenge(null);
    setPaymentState('idle');
    setPaymentError(null);
    setPaymentTxHash(null);
  }, []);

  // Initial request - triggers 402
  const handleExecuteRequest = useCallback(async () => {
    if (!selectedCapability || !validationState.isValid) return;

    const userInput = inputValue.trim();
    let input: CapabilityInput;

    if (selectedCapability.slug === 'tx-simulate') {
      const parsed = parseSwapInput(userInput);
      if (!parsed) return;
      input = parsed;
    } else {
      const address = extractAddress(userInput);
      if (!address) return;
      input = { address };
    }

    console.log('[ChatInterface] Starting execution flow');
    setPendingInput(input);
    resetPaymentState();

    // Check wallet connection
    if (!isConnected) {
      setPaymentError('Please connect your wallet first.');
      setFlowState('confirm_payment');
      setPaymentState('error');
      return;
    }

    // Check network
    if (!isCorrectNetwork) {
      console.log('[ChatInterface] Wrong network, prompting switch');
      setPaymentError('Please switch to Cronos Testnet.');
      setFlowState('confirm_payment');
      setPaymentState('error');
      await switchToDefaultNetwork();
      return;
    }

    // Make initial request (will get 402)
    try {
      console.log('[ChatInterface] Making initial request...');
      const response = await executeCapability(selectedCapability.slug, input);

      // If we get here without 402, the capability executed (mock mode?)
      console.log('[ChatInterface] Request succeeded without payment (mock mode?)');

      const userContent =
        'params' in input
          ? `${input.params.amount} ${input.params.token_in} to ${input.params.token_out}`
          : input.address;

      addMessage({ type: 'user', content: userContent });
      addMessage({
        type: 'result',
        capability: selectedCapability.slug,
        result: {
          data: response.result,
          warnings: response.warnings,
          limitations: response.limitations,
        },
        paidAmount: selectedCapability.price,
      });

      setFlowState('result');
      setInputValue('');
      setPendingInput(null);
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        // Expected! Store the challenge and show payment modal
        console.log('[ChatInterface] Received 402 - payment required');
        console.log('[ChatInterface] Challenge:', error.challenge);
        setX402Challenge(error.challenge);
        setPaymentState('awaiting_approval');
        setFlowState('confirm_payment');
      } else {
        // Unexpected error
        console.error('[ChatInterface] Unexpected error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setPaymentError(errorMessage);
        setFlowState('confirm_payment');
        setPaymentState('error');
      }
    }
  }, [
    selectedCapability,
    validationState.isValid,
    inputValue,
    isConnected,
    isCorrectNetwork,
    switchToDefaultNetwork,
    addMessage,
    resetPaymentState,
  ]);

  // Handle payment confirmation (user clicked "Confirm & Pay")
  const handleConfirmPayment = useCallback(async () => {
    if (!selectedCapability || !pendingInput || !x402Challenge || !walletClient) {
      console.error('[ChatInterface] Missing required data for payment');
      setPaymentError('Missing required data. Please try again.');
      setPaymentState('error');
      return;
    }

    console.log('[ChatInterface] User confirmed payment, starting x402 flow...');

    try {
      // Step 1: Open wallet
      setPaymentState('opening_wallet');
      console.log('[ChatInterface] Opening wallet...');

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 2: Sign payment
      setPaymentState('signing');
      console.log('[ChatInterface] Requesting signature...');

      const paymentHeader = await createX402PaymentHeader(x402Challenge, walletClient);
      console.log('[ChatInterface] Payment header created');

      // Step 3: Confirm on chain
      setPaymentState('confirming');
      console.log('[ChatInterface] Confirming...');

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Step 4: Retry with payment
      setPaymentState('retrying_request');
      console.log('[ChatInterface] Retrying request with payment proof...');

      const response = await executeCapabilityWithPayment(
        selectedCapability.slug,
        pendingInput,
        paymentHeader
      );

      // Step 5: Success!
      setPaymentState('settled');
      console.log('[ChatInterface] Payment settled, showing results');

      // Add messages
      const userContent =
        'params' in pendingInput
          ? `${pendingInput.params.amount} ${pendingInput.params.token_in} to ${pendingInput.params.token_out}`
          : pendingInput.address;

      addMessage({ type: 'user', content: userContent });
      addMessage({
        type: 'result',
        capability: selectedCapability.slug,
        result: {
          data: response.result,
          warnings: response.warnings,
          limitations: response.limitations,
        },
        paidAmount: selectedCapability.price,
      });

      // Brief delay to show success state, then close modal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFlowState('result');
      setInputValue('');
      setPendingInput(null);
      resetPaymentState();
    } catch (error) {
      console.error('[ChatInterface] Payment failed:', error);

      let errorMessage = 'Payment failed. Please try again.';

      if (error instanceof Error) {
        // User rejected
        if (error.message.includes('rejected') || error.message.includes('denied') || error.message.includes('User rejected')) {
          errorMessage = 'Transaction cancelled. You rejected the payment in your wallet.';
        }
        // Insufficient funds
        else if (error.message.includes('insufficient') || error.message.includes('balance')) {
          errorMessage = 'Insufficient funds. Please ensure you have enough devUSDC.e.';
        }
        // Wrong network
        else if (error.message.includes('network') || error.message.includes('chain')) {
          errorMessage = error.message;
        }
        // Generic
        else {
          errorMessage = error.message;
        }
      }

      setPaymentError(errorMessage);
      setPaymentState('error');
    }
  }, [
    selectedCapability,
    pendingInput,
    x402Challenge,
    walletClient,
    addMessage,
    resetPaymentState,
  ]);

  const handleCancelPayment = useCallback(() => {
    console.log('[ChatInterface] User cancelled payment');
    setFlowState('editing');
    setPendingInput(null);
    resetPaymentState();
  }, [resetPaymentState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (validationState.isValid) {
          handleExecuteRequest();
        }
      }
    },
    [validationState.isValid, handleExecuteRequest]
  );

  // =========================================
  // Computed Values
  // =========================================

  const isLoading = flowState === 'running';
  const isModalOpen = flowState === 'confirm_payment';

  // =========================================
  // Render
  // =========================================

  return (
    <div className="flex flex-col h-full">
      {/* Capability selector */}
      <div ref={capabilitySectionRef} className="p-4 border-b border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Select Operation
          </p>
          {selectedCapability && (
            <span className="text-xs text-accent">{selectedCapability.name}</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CAPABILITIES.map((cap) => (
            <CapabilityCard
              key={cap.slug}
              capability={cap}
              selected={selectedCapability?.slug === cap.slug}
              onClick={() => handleCapabilitySelect(cap)}
              disabled={isLoading || isModalOpen}
              highlight={highlightCapabilities}
            />
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Show guide only when no capability selected and no messages */}
        {messages.length === 0 && !selectedCapability && (
          <EmptyStateGuide onSelectCapability={handleScrollToCapabilities} />
        )}

        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            {message.type === 'user' && (
              <div className="flex justify-end">
                <div className="bg-surface-elevated border border-surface-border rounded-lg px-4 py-2 max-w-md">
                  <p className="text-text-primary font-mono text-sm">{message.content}</p>
                </div>
              </div>
            )}

            {message.type === 'loading' && (
              <LoadingAgent
                message={
                  selectedCapability
                    ? `Running ${selectedCapability.name}...`
                    : 'Processing...'
                }
              />
            )}

            {message.type === 'result' && message.result && message.capability && (
              <ResultDisplay
                capability={message.capability}
                result={message.result}
                paidAmount={message.paidAmount}
              />
            )}

            {message.type === 'error' && (
              <div className="card border-status-danger/20">
                <p className="font-medium text-status-danger text-sm">Error</p>
                <p className="text-xs text-status-danger/80 mt-1">{message.content}</p>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-surface-border bg-surface-elevated/50">
        {/* Selected capability indicator */}
        {selectedCapability && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-primary">{selectedCapability.name}</span>
            <span className="text-sm font-semibold text-accent">
              {selectedCapability.price}
            </span>
          </div>
        )}

        {/* Input and button */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedCapability?.placeholder || 'Select an operation above'}
              disabled={!selectedCapability || isLoading || isModalOpen}
              className={`input w-full pr-10 ${
                validationState.error ? 'border-status-danger focus:border-status-danger' : ''
              }`}
              aria-describedby={validationState.error ? 'input-error' : undefined}
            />
            {/* Validation indicator */}
            {inputValue.trim() && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                {validationState.isValid ? (
                  <span className="text-status-safe">&#10003;</span>
                ) : (
                  <span className="text-status-danger">&#10007;</span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={handleExecuteRequest}
            disabled={!selectedCapability || !validationState.isValid || isLoading || isModalOpen}
            className="btn-primary whitespace-nowrap min-w-[120px] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running</span>
              </>
            ) : (
              <span>Execute {selectedCapability?.price || ''}</span>
            )}
          </button>
        </div>

        {/* Validation error */}
        {validationState.error && (
          <p id="input-error" className="text-xs text-status-danger mt-2" role="alert">
            {validationState.error}
          </p>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-text-tertiary mt-3 text-center">
          Payment via x402 protocol. {network?.paymentToken.symbol ?? 'devUSDC.e'} on Cronos.
        </p>
      </div>

      {/* Payment Modal */}
      {selectedCapability && (
        <PaymentModal
          capability={selectedCapability}
          network={network}
          isOpen={isModalOpen}
          paymentState={paymentState}
          error={paymentError}
          txHash={paymentTxHash}
          onConfirmPayment={handleConfirmPayment}
          onCancel={handleCancelPayment}
        />
      )}
    </div>
  );
}
