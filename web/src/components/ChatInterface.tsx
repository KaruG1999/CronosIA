import { useState, useRef, useEffect } from 'react';
import { CapabilityCard, CAPABILITIES } from './CapabilityCard';
import { ResultDisplay } from './ResultDisplay';
import { LoadingAgent } from './LoadingAgent';
import { EmptyStateGuide } from './EmptyStateGuide';
import { PaymentModal } from './PaymentModal';
import {
  executeCapability,
  parseSwapInput,
  extractAddress,
  isValidAddress,
  type CapabilityInput,
} from '../api/capabilities';
import type { CapabilitySlug, CapabilityResult, CapabilityInfo } from '../types';
import type { NetworkInfo } from './Header';

// State machine states
type FlowState =
  | 'idle'
  | 'editing'
  | 'confirm_payment'
  | 'paying'
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

export function ChatInterface({ network }: ChatInterfaceProps) {
  const [selectedCapability, setSelectedCapability] = useState<CapabilityInfo | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    error: null,
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [is402Error, setIs402Error] = useState(false);
  const [pendingInput, setPendingInput] = useState<CapabilityInput | null>(null);
  const [highlightCapabilities, setHighlightCapabilities] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const capabilitySectionRef = useRef<HTMLDivElement>(null);

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

  const addMessage = (message: Omit<Message, 'id'>) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCapabilitySelect = (cap: CapabilityInfo) => {
    setSelectedCapability(cap);
    setFlowState('editing');
    setValidationState({ isValid: false, error: null });
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleScrollToCapabilities = () => {
    // Scroll to capabilities section
    capabilitySectionRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Trigger highlight animation on capability cards
    setHighlightCapabilities(true);
    setTimeout(() => setHighlightCapabilities(false), 1500);
  };

  const handlePaymentRequest = () => {
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

    setPendingInput(input);
    setPaymentError(null);
    setIs402Error(false);
    setFlowState('confirm_payment');
  };

  const handleConfirmPayment = async () => {
    if (!selectedCapability || !pendingInput) return;

    setFlowState('paying');
    setPaymentError(null);

    // Brief processing delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    setFlowState('running');

    // Add user message
    const userContent =
      'params' in pendingInput
        ? `${pendingInput.params.amount} ${pendingInput.params.token_in} to ${pendingInput.params.token_out}`
        : pendingInput.address;

    addMessage({ type: 'user', content: userContent });
    const loadingId = addMessage({ type: 'loading' });

    try {
      const response = await executeCapability(selectedCapability.slug, pendingInput);

      removeMessage(loadingId);
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
      removeMessage(loadingId);

      let errorMessage = 'An error occurred. Please try again.';

      if (error instanceof Error) {
        if (error.name === 'PaymentRequiredError') {
          setIs402Error(true);
          setPaymentError(null); // No error message needed, modal explains 402
          setFlowState('confirm_payment');
          return;
        }
        errorMessage = error.message;
      }

      addMessage({ type: 'error', content: errorMessage });
      setFlowState('error');
      setPendingInput(null);
    }
  };

  const handleCancelPayment = () => {
    setFlowState('editing');
    setPendingInput(null);
    setPaymentError(null);
    setIs402Error(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (validationState.isValid) {
        handlePaymentRequest();
      }
    }
  };

  const isLoading = flowState === 'paying' || flowState === 'running';

  return (
    <div className="flex flex-col h-full">
      {/* Capability selector */}
      <div ref={capabilitySectionRef} className="p-4 border-b border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Select Operation
          </p>
          {selectedCapability && (
            <span className="text-xs text-accent">
              {selectedCapability.name}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CAPABILITIES.map((cap) => (
            <CapabilityCard
              key={cap.slug}
              capability={cap}
              selected={selectedCapability?.slug === cap.slug}
              onClick={() => handleCapabilitySelect(cap)}
              disabled={isLoading}
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
                <p className="text-xs text-status-danger/80 mt-1">
                  {message.content}
                </p>
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
            <span className="text-sm text-text-primary">
              {selectedCapability.name}
            </span>
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
              placeholder={
                selectedCapability?.placeholder || 'Select an operation above'
              }
              disabled={!selectedCapability || isLoading}
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
            onClick={handlePaymentRequest}
            disabled={!selectedCapability || !validationState.isValid || isLoading}
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
          Payment via x402 protocol. {network?.paymentToken.symbol ?? 'USDCe'} on Cronos.
        </p>
      </div>

      {/* Payment Modal */}
      {selectedCapability && (
        <PaymentModal
          capability={selectedCapability}
          network={network}
          isOpen={flowState === 'confirm_payment' || flowState === 'paying'}
          isProcessing={flowState === 'paying'}
          error={paymentError}
          is402Error={is402Error}
          onConfirm={handleConfirmPayment}
          onCancel={handleCancelPayment}
        />
      )}
    </div>
  );
}
