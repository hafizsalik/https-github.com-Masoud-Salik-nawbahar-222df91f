export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">
      <div className="relative w-16 h-16">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-2xl bg-primary/8 animate-ping" style={{ animationDuration: '2s' }} />
        
        {/* Spinning border */}
        <div className="absolute inset-0">
          <svg className="w-16 h-16 animate-spin" style={{ animationDuration: '1.5s' }} viewBox="0 0 64 64">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="60" height="60" rx="14" ry="14" fill="none" stroke="url(#grad)" strokeWidth="2" />
          </svg>
        </div>
        
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[22px] font-black text-primary">ن</span>
        </div>
      </div>
      
      {/* Elegant loading bar */}
      <div className="w-24 h-[2px] bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full"
          style={{
            animation: 'loading-bar 1.2s ease-in-out infinite',
          }}
        />
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
