interface HeaderProps {
  networkStatus?: 'connected' | 'disconnected';
}

export function Header({ networkStatus = 'disconnected' }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cronos-deep/90 backdrop-blur-sm border-b border-neon-cyan/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/images/LogoSinFondo.png"
            alt="CronosIA"
            className="h-10 w-10 object-contain"
          />
          <span className="text-xl font-bold text-white">
            Cronos<span className="text-neon-cyan">IA</span>
          </span>
        </div>

        {/* Network Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              networkStatus === 'connected'
                ? 'bg-status-safe shadow-neon-safe'
                : 'bg-text-secondary'
            }`}
          />
          <span className="text-sm text-text-secondary">
            {networkStatus === 'connected' ? 'Cronos Mainnet' : 'Demo Mode'}
          </span>
        </div>
      </div>
    </header>
  );
}
