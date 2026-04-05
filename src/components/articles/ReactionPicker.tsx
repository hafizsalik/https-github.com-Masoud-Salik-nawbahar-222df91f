import { useState, useRef, useEffect, useCallback } from "react";
import {
  REACTION_KEYS,
  REACTION_LABELS,
  REACTION_COLORS,
  type ReactionKey,
} from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
}: ReactionPickerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [justReacted, setJustReacted] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardAuth = useCallback(() => {
    if (!user) {
      toast({ title: "برای واکنش باید وارد شوید", variant: "destructive" });
      navigate("/auth?view=login");
      return false;
    }
    return true;
  }, [user, navigate, toast]);

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
    timer.current = setTimeout(() => {
      if (guardAuth()) setOpen(true);
    }, 350);
  };

  const handleRelease = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    if (!open) {
      if (!guardAuth()) return;
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
    <div ref={ref} className="relative flex items-center">
      {/* Main reaction button */}
      <button
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        className="reaction-instant flex items-center justify-center p-1"
        style={activeColor ? { color: activeColor } : { color: "hsl(var(--muted-foreground))" }}
      >
        <span
          className="inline-flex"
          style={justReacted ? { animation: "reaction-pop 0.35s ease" } : undefined}
        >
          <ActiveIcon size={20} animated={!!userReaction} />
        </span>
      </button>

      {/* Picker tray - positioned above with enough space */}
      {(open || closing) && (
        <div
          className={cn(
            "absolute bottom-full mb-3 left-0 flex bg-card border border-border/50 rounded-2xl px-2 py-2 shadow-xl z-[60] gap-1",
            closing ? "animate-menu-out" : "animate-scale-in"
          )}
          style={{ minWidth: "260px" }}
        >
          {REACTION_KEYS.map((key) => {
            const isActive = userReaction === key;
            const Icon = REACTION_SVG_ICONS[key] || DefaultIcon;

            return (
              <button
                key={key}
                onClick={() => select(key)}
                className={cn(
                  "w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-150",
                  isActive && "scale-110"
                )}
                style={isActive ? { background: REACTION_COLORS[key]?.bg, color: REACTION_COLORS[key]?.text } : {}}
              >
                <Icon size={24} animated={isActive} />
                <span className="text-[9px] mt-0.5 text-muted-foreground leading-none">{REACTION_LABELS[key]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
