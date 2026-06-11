import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pull: number;
  refreshing: boolean;
  progress: number;
}

/**
 * Visual indicator for pull-to-refresh. Renders only when active so it
 * never affects layout in idle state.
 */
export function PullToRefreshIndicator({ pull, refreshing, progress }: Props) {
  if (pull === 0 && !refreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ transform: `translateY(${Math.min(pull, 96) - 24}px)` }}
      aria-hidden
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full bg-card border border-border/60 shadow-md flex items-center justify-center transition-opacity",
          progress < 0.3 && !refreshing && "opacity-50"
        )}
      >
        <Loader2
          className={cn(
            "h-5 w-5 text-primary transition-transform",
            refreshing ? "animate-spin" : ""
          )}
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
          }}
        />
      </div>
    </div>
  );
}
