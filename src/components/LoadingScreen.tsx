import { useState, useEffect } from "react";
import logoImg from "@/assets/logo.png";

export function LoadingScreen() {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-28 gap-6 transition-opacity duration-700"
      style={{ opacity: show ? 1 : 0 }}
    >
      {/* Logo */}
      <div
        className="relative"
        style={{ animation: "nb-logo-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both" }}
      >
        <img
          src={logoImg}
          alt="نوبهار"
          className="w-20 h-20"
          style={{ animation: "nb-breathe 3.5s ease-in-out 0.8s infinite" }}
        />
      </div>

      {/* Brand */}
      <div style={{ animation: "nb-fade-up 0.5s ease-out 0.3s both" }}>
        <span className="text-[15px] font-bold text-foreground/80 tracking-wider">نوبهار</span>
      </div>

      {/* Progress bar */}
      <div className="w-20 h-[2px] bg-border/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: "linear-gradient(90deg, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.6))",
          }}
        />
      </div>

      <style>{`
        @keyframes nb-logo-in {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        @keyframes nb-fade-up {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
