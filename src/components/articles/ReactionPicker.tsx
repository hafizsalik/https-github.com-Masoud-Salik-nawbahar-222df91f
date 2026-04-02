import { useState, useRef, useEffect, useCallback } from "react";
import { REACTION_KEYS, REACTION_LABELS, REACTION_COLORS, type ReactionKey } from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  topTypes?: ReactionKey[];
  summaryText?: string;
  onSummaryClick?: (e: React.MouseEvent) => void;
}

export function ReactionPicker({ userReaction, onReact, onHover, topTypes, summaryText, onSummaryClick }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [justReacted, setJustReacted] = useState(false);
  const prevReaction = useRef(userReaction);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth close helper
  const smoothClose = useCallback(() => {
    if (!open) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 180);
  }, [open]);

  useEffect(() => {
    if (prevReaction.current !== userReaction && prevReaction.current !== undefined) {
      if (prevReaction.current !== null || justReacted) {
        setJustReacted(true);
        const t = setTimeout(() => setJustReacted(false), 400);
        return () => clearTimeout(t);
      }
    }
    prevReaction.current = userReaction;
  }, [userReaction]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const close = () => smoothClose();
    window.addEventListener("scroll", close, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", close, true);
  }, [open, smoothClose]);

  // Click-outside: works for both mouse and touch
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent | MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        smoothClose();
      }
    };
    // Use pointerdown for unified mouse+touch
    document.addEventListener("pointerdown", handler, true);
    document.addEventListener("touchstart", handler, { passive: true, capture: true });
    return () => {
      document.removeEventListener("pointerdown", handler, true);
      document.removeEventListener("touchstart", handler, true as any);
    };
  }, [open, smoothClose]);

  // Tap = quick like, long press = open picker
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHover?.();
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      setOpen(true);
      setClosing(false);
    }, 400);
  }, [onHover]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      if (userReaction === "like") {
        onReact("like");
      } else if (!userReaction) {
        setJustReacted(true);
        onReact("like");
      } else {
        setOpen(true);
        setClosing(false);
      }
    }
  }, [userReaction, onReact]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Desktop click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.matchMedia("(hover: hover)").matches) {
      onHover?.();
      if (open) {
        smoothClose();
      } else {
        setOpen(true);
        setClosing(false);
      }
    }
  };

  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJustReacted(true);
    onReact(type);
    smoothClose();
  };

  const activeColor = userReaction ? REACTION_COLORS[userReaction]?.text : undefined;

  const renderInlineIcon = () => {
    const IconComponent = (userReaction && REACTION_SVG_ICONS[userReaction]) ? REACTION_SVG_ICONS[userReaction] : REACTION_SVG_ICONS.like;
    const style = justReacted ? { animation: "reaction-pop-enhanced 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both" } : {};
    
    if (!IconComponent) {
      return <span className="w-4 h-4 text-muted-foreground/50 reaction-icon">👍</span>;
    }

    return (
      <span style={style} className="flex items-center reaction-icon">
        <IconComponent 
          size={16} 
          strokeWidth={userReaction ? 2.2 : 1.8}
          animated={justReacted}
          className={cn(
            "reaction-instant",
            userReaction ? "" : "text-muted-foreground/50"
          )}
        />
      </span>
    );
  };

  const handleSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSummaryClick) {
      onSummaryClick(e);
    } else {
      onHover?.();
      if (open) smoothClose();
      else { setOpen(true); setClosing(false); }
    }
  };

  const isVisible = open && !closing;
  const animClass = closing ? "animate-picker-out" : "animate-picker-in";

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 sm:gap-1.5">
      {/* Main icon button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
        className="flex items-center touch-none select-none reaction-instant hover:scale-105 active:scale-95"
        style={activeColor ? { color: activeColor } : {}}
      >
        {renderInlineIcon()}
      </button>

      {/* Summary text */}
      <button
        onClick={handleSummaryClick}
        className="text-[10.5px] sm:text-[11px] truncate max-w-[120px] sm:max-w-[150px] text-muted-foreground/60 hover:text-foreground reaction-instant hover:scale-105 active:scale-95"
      >
        {summaryText || "واکنش"}
      </button>

      {/* Reaction picker panel */}
      {(open || closing) && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-50",
            "sm:absolute sm:inset-auto sm:bottom-full sm:mb-2.5 sm:left-1/2 sm:-translate-x-1/2",
            "flex items-center justify-center",
            "sm:rounded-full rounded-t-2xl",
            "px-3 sm:px-2 py-3 sm:py-1.5",
            animClass
          )}
          style={{
            background: "hsl(var(--card))",
            boxShadow: "0 -6px 30px -6px hsl(var(--foreground) / 0.12), 0 0 0 1px hsl(var(--border) / 0.4)",
          }}
        >
          <div className="flex items-center gap-0.5 sm:gap-0">
            {REACTION_KEYS.map((key, i) => {
              const isActive = userReaction === key;
              const IconComponent = REACTION_SVG_ICONS[key] || REACTION_SVG_ICONS.like;
              const color = REACTION_COLORS[key] || REACTION_COLORS.like;
              return (
                <button
                  key={key}
                  onClick={(e) => handleSelect(key as ReactionKey, e)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl reaction-instant reaction-icon",
                    "w-[54px] h-[58px] sm:w-[42px] sm:h-[42px]",
                    "hover:scale-[1.15] hover:-translate-y-1.5 active:scale-90 hover:shadow-lg",
                    isActive && "scale-[1.05] shadow-md"
                  )}
                  style={{
                    animation: closing ? 'none' : `reaction-entry-enhanced 0.25s ease-out ${i * 35}ms both`,
                    ...(isActive ? { backgroundColor: color.bg } : {}),
                  }}
                >
                  <IconComponent 
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    animated={isActive}
                    className={cn(
                      "reaction-instant reaction-icon",
                      isActive ? "" : "text-muted-foreground hover:text-foreground"
                    )}
                  />
                  <span className={cn(
                    "text-[8.5px] sm:hidden mt-1 leading-none",
                    isActive ? "font-medium" : "text-muted-foreground/60"
                  )}
                    style={isActive ? { color: color.text } : {}}
                  >
                    {REACTION_LABELS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {(open || closing) && (
        <div
          className={cn(
            "fixed inset-0 z-40 sm:hidden",
            closing ? "animate-fade-out" : "animate-fade-in",
            "bg-background/15"
          )}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); smoothClose(); }}
        />
      )}
    </div>
  );
}
