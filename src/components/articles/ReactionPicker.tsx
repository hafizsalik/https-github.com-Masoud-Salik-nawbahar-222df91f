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
import { X } from "lucide-react";

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
    }, 250);
  }, []);

  // Close on outside click/touch
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open, close]);

  // Close on back button / escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
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
      >
        <span
          className="inline-flex"
          style={justReacted ? { animation: "reaction-pop 0.35s ease" } : undefined}
        >
          <ActiveIcon size={20} animated={!!userReaction} style={activeColor ? { color: activeColor } : undefined} />
        </span>
      </button>

      {/* Bottom sheet overlay for mobile */}
      {(open || closing) && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={(e) => { e.stopPropagation(); close(); }}
        >
          {/* Backdrop */}
          <div className={cn(
            "absolute inset-0 bg-background/20 backdrop-blur-[2px]",
            closing ? "animate-fade-out" : "animate-fade-in"
          )} />

          {/* Bottom sheet */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-xl",
              closing ? "animate-bottom-sheet-out" : "animate-bottom-sheet-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Title */}
            <div className="flex items-center justify-between px-5 pb-3">
              <span className="text-sm font-semibold text-foreground">واکنش شما</span>
              <button onClick={close} className="p-1 text-muted-foreground hover:text-foreground">
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Reaction grid */}
            <div className="flex items-center justify-around px-4 pb-6 safe-bottom">
              {REACTION_KEYS.map((key) => {
                const isActive = userReaction === key;
                const Icon = REACTION_SVG_ICONS[key] || DefaultIcon;
                const colors = REACTION_COLORS[key];

                return (
                  <button
                    key={key}
                    onClick={() => select(key)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl transition-all duration-200 w-14 h-16",
                      "active:scale-90",
                      isActive && "scale-105"
                    )}
                    style={{
                      color: colors?.text,
                      ...(isActive ? {
                        background: colors?.bg,
                        boxShadow: `0 0 0 2px ${colors?.ring}`,
                      } : {}),
                    }}
                  >
                    <Icon size={28} animated={isActive} />
                    <span className={cn(
                      "text-[10px] mt-1 leading-none font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground/60"
                    )}>
                      {REACTION_LABELS[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
