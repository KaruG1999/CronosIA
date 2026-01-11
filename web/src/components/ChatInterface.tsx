import { useState, useRef, useEffect } from 'react';
import { CapabilityCard, CAPABILITIES } from './CapabilityCard';
import { ResultDisplay } from './ResultDisplay';
import { LoadingAgent } from './LoadingAgent';
import {
  executeCapability,
  parseSwapInput,
  extractAddress,
  type CapabilityInput,
} from '../api/capabilities';
import type { CapabilitySlug, CapabilityResult, CapabilityInfo } from '../types';

interface Message {
  id: string;
  type: 'user' | 'result' | 'error' | 'loading';
  content?: string;
  capability?: CapabilitySlug;
  result?: CapabilityResult;
}

export function ChatInterface() {
  const [selectedCapability, setSelectedCapability] = useState<CapabilityInfo | null>(
    null
  );
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (message: Omit<Message, 'id'>) => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedCapability || !inputValue.trim() || isLoading) return;

    const userInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    addMessage({ type: 'user', content: userInput });

    // Add loading message
    const loadingId = addMessage({ type: 'loading' });

    try {
      let input: CapabilityInput;

      // Parse input based on capability
      if (selectedCapability.slug === 'tx-simulate') {
        const parsed = parseSwapInput(userInput);
        if (!parsed) {
          throw new Error(
            'Formato invalido. Usa: "100 CRO a USDC" o "50 USDC to CRO"'
          );
        }
        input = parsed;
      } else {
        const address = extractAddress(userInput);
        if (!address) {
          throw new Error(
            'Direccion invalida. Debe ser una direccion de Cronos (0x...)'
          );
        }
        input = { address };
      }

      // Execute capability
      const response = await executeCapability(selectedCapability.slug, input);

      // Remove loading and add result
      removeMessage(loadingId);
      addMessage({
        type: 'result',
        capability: selectedCapability.slug,
        result: response.result,
      });
    } catch (error) {
      removeMessage(loadingId);

      let errorMessage = 'Ocurrio un error inesperado. Intenta de nuevo.';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      addMessage({ type: 'error', content: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Capability selector */}
      <div className="p-4 border-b border-neon-cyan/10">
        <p className="text-sm text-text-secondary mb-3">Selecciona una accion:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CAPABILITIES.map((cap) => (
            <CapabilityCard
              key={cap.slug}
              capability={cap}
              selected={selectedCapability?.slug === cap.slug}
              onClick={() => setSelectedCapability(cap)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <img
              src="/images/LogoSinFondo.png"
              alt="CronosIA"
              className="w-24 h-24 object-contain opacity-30 mb-4"
            />
            <p className="text-text-secondary text-lg">
              Selecciona una accion y pega una direccion
            </p>
            <p className="text-text-secondary/60 text-sm mt-2">
              El precio se cobra via x402 antes de ejecutar
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            {message.type === 'user' && (
              <div className="flex justify-end">
                <div className="bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg px-4 py-2 max-w-md">
                  <p className="text-white">{message.content}</p>
                </div>
              </div>
            )}

            {message.type === 'loading' && (
              <LoadingAgent
                message={
                  selectedCapability
                    ? `Ejecutando ${selectedCapability.name}...`
                    : 'Procesando...'
                }
              />
            )}

            {message.type === 'result' && message.result && message.capability && (
              <ResultDisplay
                capability={message.capability}
                result={message.result}
              />
            )}

            {message.type === 'error' && (
              <div className="card border-status-danger/30">
                <div className="flex items-center gap-2 text-status-danger">
                  <span>⛔</span>
                  <span>{message.content}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-neon-cyan/10">
        {selectedCapability && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{selectedCapability.icon}</span>
            <span className="text-sm text-text-secondary">
              {selectedCapability.name}
            </span>
            <span className="text-sm font-bold text-neon-cyan">
              {selectedCapability.price}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCapability?.placeholder ||
              'Selecciona una accion arriba...'
            }
            disabled={!selectedCapability || isLoading}
            className="neon-input flex-1"
          />
          <button
            onClick={handleSubmit}
            disabled={!selectedCapability || !inputValue.trim() || isLoading}
            className="neon-button whitespace-nowrap"
          >
            {isLoading ? 'Procesando...' : `Pagar ${selectedCapability?.price || ''}`}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-secondary/60 mt-2 text-center">
          Al ejecutar, aceptas que el pago es via x402 y el analisis es orientativo.
        </p>
      </div>
    </div>
  );
}
