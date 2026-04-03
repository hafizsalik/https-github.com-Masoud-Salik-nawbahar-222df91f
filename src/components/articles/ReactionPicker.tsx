import { useState, useRef, useEffect, useCallback } from "react";
import {
  REACTION_KEYS,
  REACTION_LABELS,
  REACTION_COLORS,
  type ReactionKey,
} from "@/hooks/useCardReactions";
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

export function ReactionPicker({
  userReaction,
  onReact,
  onHover,
  topTypes,
  summaryText,
  onSummaryClick,
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [justReacted, setJustReacted] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 180);
  }, []);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    if (open) document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open, close]);

  const handlePress = () => {
    onHover?.();
    timer.current = setTimeout(() => setOpen(true), 350);
  };

  const handleRelease = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    if (!open) {
      if (!userReaction) {
        onReact("like");
        setJustReacted(true);
      } else {
        setOpen(true);
      }
    }
  };

  const select = (type: ReactionKey) => {
    onReact(type);
    setJustReacted(true);
    close();
  };

  const activeColor = userReaction ? REACTION_COLORS[userReaction]?.text : undefined;
  const DefaultIcon = REACTION_SVG_ICONS["like"];
  const ActiveIcon = userReaction ? (REACTION_SVG_ICONS[userReaction] || DefaultIcon) : DefaultIcon;

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      {/* Main reaction button */}
      <button
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        className="reaction-instant flex items-center justify-center"
        style={activeColor ? { color: activeColor } : { color: "hsl(var(--muted-foreground))" }}
      >
        <span
          className="inline-flex"
          style={justReacted ? { animation: "reaction-pop 0.35s ease" } : undefined}
        >
          <ActiveIcon size={18} animated={!!userReaction} />
        </span>
      </button>

      {/* Summary text */}
      {summaryText && (
        <button
          onClick={(e) => onSummaryClick ? onSummaryClick(e) : setOpen((p) => !p)}
          className="text-[12px] truncate max-w-[120px]"
          style={{ color: activeColor || "hsl(var(--muted-foreground))" }}
        >
          {summaryText}
        </button>
      )}

      {/* Picker tray */}
      {(open || closing) && (
        <div
          className={cn(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex bg-card border border-border/50 rounded-2xl px-1.5 py-1.5 shadow-lg z-50 gap-0.5",
            closing ? "animate-menu-out" : "animate-scale-in"
          )}
        >
          {REACTION_KEYS.map((key) => {
            const isActive = userReaction === key;
            const Icon = REACTION_SVG_ICONS[key] || DefaultIcon;

            return (
              <button
                key={key}
                onClick={() => select(key)}
                className={cn(
                  "w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all duration-150",
                  isActive && "scale-110"
                )}
                style={isActive ? { background: REACTION_COLORS[key]?.bg, color: REACTION_COLORS[key]?.text } : {}}
              >
                <Icon size={20} animated={isActive} />
                <span className="text-[8px] mt-0.5 text-muted-foreground">{REACTION_LABELS[key]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
