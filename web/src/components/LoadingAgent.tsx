interface LoadingAgentProps {
  message?: string;
}

export function LoadingAgent({ message = 'Processing...' }: LoadingAgentProps) {
  return (
    <div className="card flex items-center gap-4">
      {/* Simple spinner */}
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>

      {/* Message */}
      <div>
        <p className="text-text-primary font-medium text-sm">{message}</p>
        <p className="text-xs text-text-secondary">This may take a few seconds</p>
      </div>
    </div>
  );
}
