interface LoadingAgentProps {
  message?: string;
}

export function LoadingAgent({ message = 'Analizando...' }: LoadingAgentProps) {
  return (
    <div className="card flex items-center gap-4">
      {/* Animated logo */}
      <div className="relative">
        <img
          src="/images/LogoSinFondo.png"
          alt="CronosIA"
          className="w-12 h-12 object-contain animate-pulse-glow"
        />
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-neon-cyan/20 animate-ping" />
      </div>

      {/* Message */}
      <div>
        <p className="text-white font-medium">{message}</p>
        <p className="text-sm text-text-secondary">Esto puede tomar unos segundos...</p>
      </div>
    </div>
  );
}
