import { useOfflineStatus } from "@/hooks/useOfflineStatus";

interface OfflinePageProps {
  children: React.ReactNode;
}

/**
 * Wraps a page that requires network. Shows a beautiful offline fallback
 * with the poem "دست ما کوتاه و خرما بر نخیل" when offline.
 */
export function OfflineFallback({ children }: OfflinePageProps) {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
      {/* Decorative palm tree */}
      <div className="relative mb-8">
        <div className="text-6xl animate-float">🌴</div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-muted/40 rounded-full blur-md" />
      </div>

      {/* Poetry */}
      <blockquote className="max-w-[280px] mb-6" dir="rtl">
        <p className="text-[18px] font-bold text-foreground leading-[2.2] tracking-wide">
          دست ما کوتاه و خرما بر نخیل
        </p>
        <div className="w-12 h-px bg-border mx-auto my-3" />
      </blockquote>

      {/* Explanation */}
      <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[240px] mb-2">
        به اینترنت دسترسی ندارید.
      </p>
      <p className="text-[11.5px] text-muted-foreground/50 leading-relaxed max-w-[260px]">
        مطالبی که قبلاً خوانده‌اید همچنان قابل دسترس هستند.
      </p>

      {/* Decorative dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 animate-pulse"
            style={{ animationDelay: `${i * 300}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
