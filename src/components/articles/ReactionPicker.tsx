import { useState, useRef, useEffect } from "react";
import { REACTION_EMOJIS, type ReactionKey } from "@/hooks/useCardReactions";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
}

export function ReactionPicker({ userReaction, onReact }: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), 400);
  };

  const handlePointerLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 300);
  };

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) return;
    // Quick tap = toggle default "like"
    onReact("like");
  };

  const handleLongPress = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), 400);
  };

  const handleSelect = (type: ReactionKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReact(type);
    setOpen(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Close picker on outside click
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

  const activeEmoji = userReaction ? REACTION_EMOJIS[userReaction] : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        onClick={handleTap}
        onTouchStart={handleLongPress}
        onTouchEnd={() => clearTimeout(timeoutRef.current)}
        className={cn(
          "flex items-center gap-1.5 text-[12px] transition-all duration-200",
          userReaction
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="text-[15px] leading-none">
          {activeEmoji || "👍"}
        </span>
        {userReaction && (
          <span className="text-[11px] font-medium">
            {userReaction === "like" && "پسند"}
            {userReaction === "love" && "عالی"}
            {userReaction === "insightful" && "آموزنده"}
            {userReaction === "clap" && "تحسین"}
            {userReaction === "fire" && "عالی"}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 flex items-center gap-0.5 bg-background border border-border rounded-full px-2 py-1.5 shadow-lg animate-scale-in z-50">
          {Object.entries(REACTION_EMOJIS).map(([key, emoji], i) => (
            <button
              key={key}
              onClick={(e) => handleSelect(key as ReactionKey, e)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full text-[20px] transition-transform duration-150 hover:scale-[1.35] hover:bg-muted/50",
                userReaction === key && "bg-primary/10 scale-110"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
              title={key}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
