import { useState, useRef, useEffect, useCallback } from "react";
import {
  REACTION_KEYS,
  REACTION_LABELS,
  REACTION_COLORS,
  type ReactionKey,
} from "@/hooks/useCardReactions";
import { REACTION_SVG_ICONS } from "./ReactionIcons";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface ReactionPickerButtonProps {
  userReaction: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  count?: number;
  reactorNames?: string[];
}

export function ReactionPickerButton({
  userReaction,
  onReact,
  count = 0,
  reactorNames = [],
}: ReactionPickerButtonProps) {
  // State
  const [showCard, setShowCard] = useState(false);
  const [cardClosing, setCardClosing] = useState(false);
  const [pointPosition, setPointPosition] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pointerStartTime = useRef<number>(0);
  const isPointerDown = useRef(false);

  // Constants
  const TAP_THRESHOLD = 300; // ms
  const LONG_PRESS_DURATION = 400; // ms

  // Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    isPointerDown.current = true;
    pointerStartTime.current = Date.now();

    // Get position for card placement
    const rect = buttonRef.current?.getBoundingClientRect();
    setPointPosition({
      x: rect?.left || e.clientX,
      y: rect?.top || e.clientY,
    });

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (isPointerDown.current) {
        setShowCard(true);
        triggerHaptic("light");
      }
      longPressTimer.current = null;
    }, LONG_PRESS_DURATION);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      isPointerDown.current = false;
      const duration = Date.now() - pointerStartTime.current;

      if (longPressTimer.current) {
        // TAP detected (<300ms)
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;

        if (duration < TAP_THRESHOLD) {
          // Quick tap action: toggle like
          if (userReaction === "like") {
            onReact("like"); // Remove like
          } else if (!userReaction) {
            onReact("like"); // Add like
          } else {
            // Has different reaction - show card to change
            setShowCard(true);
          }
          triggerHaptic("medium");
        }
      }
      // If long press was already detected, card is already open
    },
    [userReaction, onReact]
  );

  const handlePointerCancel = useCallback(() => {
    isPointerDown.current = false;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const closeCard = useCallback(() => {
    setCardClosing(true);
    setTimeout(() => {
      setShowCard(false);
      setCardClosing(false);
    }, 150);
  }, []);

  const handleReactionSelect = useCallback(
    (type: ReactionKey) => {
      onReact(type);
      closeCard();
      triggerHaptic("medium");
    },
    [onReact, closeCard]
  );

  // Render
  const activeHexColor = userReaction ? REACTION_COLORS[userReaction]?.text : undefined;
  const Icon = userReaction
    ? REACTION_SVG_ICONS[userReaction]
    : REACTION_SVG_ICONS.like;

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Main reaction button */}
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={cn(
          "flex items-center justify-center gap-2",
          "px-3 py-2 rounded-lg",
          "touch-none select-none",
          "hover:bg-muted/50 active:scale-95",
          "transition-all duration-200",
          userReaction && "ring-1"
        )}
        style={
          userReaction
            ? {
              backgroundColor: REACTION_COLORS[userReaction]?.bg,
              color: activeHexColor,
              borderColor: REACTION_COLORS[userReaction]?.ring,
              outlineColor: REACTION_COLORS[userReaction]?.ring,
            }
            : { color: "hsl(var(--muted-foreground))" }
        }
      >
        {/* Icon */}
        {Icon && (
          <Icon
            size={18}
            strokeWidth={userReaction ? 2.2 : 1.8}
            animated={!!userReaction}
            className="reaction-icon"
          />
        )}

        {/* Count badge */}
        {count > 0 && (
          <span className="text-[10px] font-medium">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Floating Card - Conditional Render */}
      {showCard && (
        <ReactionCardPickerInline
          onReact={handleReactionSelect}
          onClose={closeCard}
          userReaction={userReaction}
          position={pointPosition}
          isClosing={cardClosing}
        />
      )}
    </div>
  );
}

/**
 * Inline floating card component for reaction selection
 */
interface ReactionCardPickerInlineProps {
  onReact: (type: ReactionKey) => void;
  onClose: () => void;
  userReaction?: ReactionKey | null;
  position?: { x: number; y: number } | null;
  isClosing?: boolean;
}

function ReactionCardPickerInline({
  onReact,
  onClose,
  userReaction,
  position,
  isClosing = false,
}: ReactionCardPickerInlineProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeReaction, setActiveReaction] = useState<ReactionKey | null>(
    userReaction || null
  );
  const [cardPosition, setCardPosition] = useState<{ top: string; left: string }>({
    top: "0",
    left: "0",
  });

  // Close on backdrop click
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay to avoid immediate trigger
    const timerId = setTimeout(() => {
      document.addEventListener("pointerdown", handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, [onClose]);

  // Calculate card position (adaptive for mobile/desktop)
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    if (isMobile) {
      // Mobile: Center at bottom
      setCardPosition({
        top: "auto",
        left: "50%",
      });
    } else {
      // Desktop: Near mouse position, adjusted for visibility
      const y = position?.y ? Math.max(position.y - 100, 10) : 10;
      const x = position?.x ? Math.max(position.x - 80, 10) : 10;
      setCardPosition({
        top: `${y}px`,
        left: `${x}px`,
      });
    }
  }, [position]);

  const handleReactionHover = (type: ReactionKey) => {
    setActiveReaction(type);
    triggerHaptic("light");
  };

  const handleReactionSelect = (type: ReactionKey) => {
    onReact(type);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-background/20"
          onClick={onClose}
        />
      )}

      {/* Floating Card */}
      <div
        ref={cardRef}
        className={cn(
          "fixed z-50",
          "flex items-center gap-1",
          "px-3 py-2.5",
          "bg-card rounded-full",
          "shadow-lg border border-border",
          "pointer-events-auto",
          isMobile
            ? "bottom-16 left-1/2 -translate-x-1/2"
            : ""
        )}
        style={{
          ...(!isMobile && cardPosition),
          animation: isClosing
            ? "reactionCardExit 150ms ease-out forwards"
            : "reactionCardEnter 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {REACTION_KEYS.map((key, index) => {
          const isActive = activeReaction === key;
          const isSelected = userReaction === key;
          const colors = REACTION_COLORS[key];
          const Icon = REACTION_SVG_ICONS[key];

          return (
            <button
              key={key}
              onPointerMove={() => handleReactionHover(key)}
              onPointerUp={() => handleReactionSelect(key)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleReactionSelect(key);
              }}
              className={cn(
                "flex items-center justify-center",
                "w-12 h-12 rounded-full",
                "transition-all duration-150",
                "touch-none select-none",
                isActive && "scale-110",
                isSelected && "ring-2",
                "hover:scale-110 active:scale-90"
              )}
              style={{
                animation: `reactionIconEnter 200ms ease-out ${index * 40}ms both`,
                ...(isSelected
                  ? {
                    backgroundColor: colors?.bg,
                    boxShadow: `0 0 0 2px ${colors?.ring}`,
                    color: colors?.text,
                  }
                  : {}),
              }}
            >
              {Icon && (
                <Icon
                  size={24}
                  strokeWidth={isActive || isSelected ? 2.2 : 1.8}
                  animated={isActive || isSelected}
                  className="reaction-icon"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes reactionCardEnter {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes reactionCardExit {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }

        @keyframes reactionIconEnter {
          0% {
            opacity: 0;
            transform: scale(0.4) rotateZ(-20deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateZ(0deg);
          }
        }
      `}</style>
    </>
  );
}
