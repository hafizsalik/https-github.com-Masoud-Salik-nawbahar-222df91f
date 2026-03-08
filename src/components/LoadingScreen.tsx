import { useState, useEffect } from "react";

export function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-28 gap-6 transition-opacity duration-500"
      style={{ opacity: show ? 1 : 0 }}
    >
      {/* Animated logo container */}
      <div className="relative w-24 h-24">
        {/* Pulsing glow */}
        <div
          className="absolute inset-0 rounded-[22px]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
            animation: "hesab-glow 2s ease-in-out infinite",
          }}
        />

        {/* Rotating ring segments */}
        <svg className="absolute inset-0 w-24 h-24" viewBox="0 0 96 96">
          <defs>
            <linearGradient id="ring1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ring2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Primary ring */}
          <rect
            x="6" y="6" width="84" height="84" rx="20" ry="20"
            fill="none" stroke="url(#ring1)" strokeWidth="2"
            strokeDasharray="80 260"
            style={{ animation: "hesab-ring-spin 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite" }}
          />
          {/* Secondary ring */}
          <rect
            x="6" y="6" width="84" height="84" rx="20" ry="20"
            fill="none" stroke="url(#ring2)" strokeWidth="1.5"
            strokeDasharray="60 280"
            style={{ animation: "hesab-ring-spin 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse" }}
          />
        </svg>

        {/* Static subtle border */}
        <div
          className="absolute inset-[8px] rounded-[16px] border border-primary/8"
        />

        {/* Center letter */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: "hesab-letter-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both" }}
        >
          <span
            className="text-[32px] font-black text-primary select-none"
            style={{ animation: "hesab-letter-breathe 3s ease-in-out 1s infinite" }}
          >
            ن
          </span>
        </div>
      </div>

      {/* Brand name */}
      <div style={{ animation: "hesab-fade-up 0.6s ease-out 0.4s both" }}>
        <span className="text-lg font-bold text-foreground tracking-wide">نوبهار</span>
      </div>

      {/* Premium shimmer progress bar */}
      <div className="w-24 h-[3px] bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)",
            backgroundSize: "200% 100%",
            animation: "hesab-shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes hesab-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes hesab-ring-spin {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -340; }
        }
        @keyframes hesab-letter-in {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes hesab-letter-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes hesab-fade-up {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes hesab-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
