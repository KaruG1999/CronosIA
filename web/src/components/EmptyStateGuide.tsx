interface EmptyStateGuideProps {
  onSelectCapability?: () => void;
}

export function EmptyStateGuide({ onSelectCapability }: EmptyStateGuideProps) {
  const steps = [
    {
      number: '1',
      title: 'Select',
      description: 'Choose an operation',
    },
    {
      number: '2',
      title: 'Pay',
      description: 'Confirm micro-payment',
    },
    {
      number: '3',
      title: 'Review',
      description: 'Analyze results',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-full max-w-md">
        {/* Main Panel */}
        <div className="panel rounded-xl p-6 sm:p-8 text-center">
          {/* Title */}
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-2">
            Pay-per-action Security Analysis
          </h2>

          {/* Subtitle */}
          <p className="text-text-secondary text-sm mb-6">
            Each operation has a fixed cost paid via x402.
          </p>

          {/* 3-Step Flow - Horizontal on desktop, simpler on mobile */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                {/* Step */}
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-accent/10 text-accent text-sm font-semibold flex items-center justify-center mb-1">
                    {step.number}
                  </span>
                  <p className="font-medium text-text-primary text-xs sm:text-sm">
                    {step.title}
                  </p>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="mx-2 sm:mx-3 text-text-tertiary text-xs">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button - Clear and prominent */}
          <button
            onClick={onSelectCapability}
            className="w-full sm:w-auto btn-primary px-6 py-2.5 text-sm font-medium"
          >
            Select an operation above ↑
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] sm:text-xs text-text-tertiary text-center mt-4 px-4">
          Informational analysis only. Verify with official sources.
        </p>
      </div>
    </div>
  );
}
