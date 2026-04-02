import { useState, useRef, useEffect, useCallback } from "react";
import {
  REACTION_KEYS,
  REACTION_LABELS,
  REACTION_COLORS,
  type ReactionKey,
} from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS: Record<ReactionKey, string> = {
  like: "👍",
  love: "❤️",
  sad: "😢",
  fire: "🔥",
  star: "⭐",
  educative: "🎓",
};

export function ReactionPicker({
  userReaction,
  onReact,
  onHover,
  summaryText,
  onSummaryClick,
}: {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  onHover?: () => void;
  summaryText?: string;
  onSummaryClick?: (e: React.MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [justReacted, setJustReacted] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

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

    if (!userReaction) {
      onReact("like");
      setJustReacted(true);
    } else setOpen(true);
  };

  const select = (type: ReactionKey) => {
    onReact(type);
    setJustReacted(true);
    close();
  };

  const activeColor = userReaction
    ? REACTION_COLORS[userReaction]?.text
    : undefined;

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Main */}
      <button
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        className="reaction-instant"
        style={activeColor ? { color: activeColor } : {}}
      >
        <span
          className="text-[16px]"
          style={
            justReacted
              ? { animation: "reaction-pop 0.35s ease" }
              : undefined
          }
        >
          {userReaction ? REACTION_EMOJIS[userReaction] : "👍"}
        </span>
      </button>

      {/* Summary */}
      <button
        onClick={(e) =>
          onSummaryClick ? onSummaryClick(e) : setOpen((p) => !p)
        }
        className="text-[11px] truncate text-muted-foreground"
      >
        {summaryText || "واکنش"}
      </button>

      {/* Picker */}
      {(open || closing) && (
        <div
          className={cn(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex bg-card rounded-full px-2 py-1.5 shadow-lg z-50",
            closing ? "animate-out" : "animate-in"
          )}
        >
          {REACTION_KEYS.map((key) => {
            const isActive = userReaction === key;
            const Icon = REACTION_SVG_ICONS[key];

            return (
              <button
                key={key}
                onClick={() => select(key)}
                className={cn(
                  "w-10 h-10 flex flex-col items-center justify-center rounded-xl transition",
                  isActive && "scale-105 shadow"
                )}
                style={
                  isActive
                    ? { background: REACTION_COLORS[key].bg }
                    : undefined
                }
              >
                <Icon size={20} animated={isActive} />
                <span className="text-[8px]">
                  {REACTION_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}