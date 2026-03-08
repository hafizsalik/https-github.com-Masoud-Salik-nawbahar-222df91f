import { useState, useRef, useEffect } from "react";
import { REACTION_EMOJIS, REACTION_LABELS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  /** Emoji types to show as small badges after the icon */
  summaryEmojis?: ReactionKey[];
  /** Text to show after emojis (e.g. "شما، احمد و ۵ نفر دیگر") */
  summaryText?: string;
  /** Click handler for the summary text (opens details modal) */
  onSummaryClick?: (e: React.MouseEvent) => void;
}

export function ReactionPicker({
  userReaction,
  onReact,
  onHover,
  summaryEmojis = [],
  summaryText,
  onSummaryClick,
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  const handlePointerEnter = () => {
    clearTimeout(timeoutRef.current);
    onHover?.();
    timeoutRef.current = setTimeout(() => setOpen(true), 350);
  };

  const handlePointerLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 250);
  };

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open || longPressRef.current) {
      longPressRef.current = false;
      return;
    }
    onReact("like");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    longPressRef.current = false;
    clearTimeout(timeoutRef.current);
    onHover?.();
    timeoutRef.current = setTimeout(() => {
      longPressRef.current = true;
      setOpen(true);
    }, 400);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!longPressRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReact(type);
    setOpen(false);
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSummaryClick?.(e);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const hasReactions = summaryEmojis.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-1.5"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* The reaction icon button (tap = like, long-press = picker) */}
      <button
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-center transition-all duration-200",
          userReaction
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {userReaction ? (
          <span className="text-[14px] leading-none">{REACTION_EMOJIS[userReaction]}</span>
        ) : (
          <ThumbsUp size={14} strokeWidth={1.5} />
        )}
      </button>

      {/* Summary: emoji badges + text */}
      {summaryText && (
        <button
          onClick={onSummaryClick ? handleTextClick : handleTap}
          className="flex items-center gap-1 min-w-0 hover:opacity-75 transition-opacity"
        >
          {hasReactions && (
            <div className="flex items-center -space-x-1 flex-shrink-0">
              {summaryEmojis.map((type) => (
                <span
                  key={type}
                  className="w-[15px] h-[15px] flex items-center justify-center rounded-full text-[9.5px] leading-none border-[1.5px] border-background"
                  style={{ background: "hsl(var(--muted))" }}
                  role="img"
                  aria-label={type}
                >
                  {REACTION_EMOJIS[type]}
                </span>
              ))}
            </div>
          )}
          <span className="text-[11px] text-muted-foreground/60 truncate max-w-[150px]">
            {summaryText}
          </span>
        </button>
      )}

      {/* Emoji picker tray */}
      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 flex items-center gap-0.5 rounded-full px-2 py-1.5 z-50 animate-scale-in"
          style={{
            background: "hsl(var(--background))",
            boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.12), 0 0 0 1px hsl(var(--border) / 0.6)",
          }}
        >
          {Object.entries(REACTION_EMOJIS).map(([key, emoji], i) => (
            <button
              key={key}
              onClick={(e) => handleSelect(key as ReactionKey, e)}
              className={cn(
                "w-[32px] h-[32px] flex items-center justify-center rounded-full text-[18px] transition-all duration-150",
                "hover:scale-[1.35] hover:-translate-y-1",
                userReaction === key && "bg-muted scale-110"
              )}
              style={{
                animation: `scale-in 0.18s ease-out ${i * 25}ms both`,
              }}
              title={REACTION_LABELS[key]}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
