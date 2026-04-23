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
  reactorNames?: string[];
  isProcessing?: boolean;
}

export function ReactionPickerButton({
  userReaction,
  onReact,
  isProcessing = false,
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
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 640;
  const TAP_THRESHOLD = isMobileView ? 150 : 200; // Faster tap detection on mobile
  const LONG_PRESS_DURATION = isMobileView ? 350 : 400; // Shorter long-press on mobile

  // Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    isPointerDown.current = true;
    pointerStartTime.current = Date.now();

    // Get position for card placement (store center X to match translateX(-50%))
    const rect = buttonRef.current?.getBoundingClientRect();
    setPointPosition({
      x: rect ? rect.left + rect.width / 2 : e.clientX,
      y: rect ? rect.top : e.clientY,
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
        disabled={isProcessing}
        className={cn(
          "flex items-center justify-center gap-2",
          "px-3 py-2 rounded-lg",
          "touch-none select-none",
          "hover:scale-105 active:scale-95",
          "transition-all duration-200",
          userReaction && "text-foreground",
          isProcessing && "opacity-60 cursor-not-allowed"
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
  const [isDragging, setIsDragging] = useState(false);

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

  // Calculate card position with viewport boundary detection
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    if (isMobile) {
      // Mobile: Fixed bottom position with proper centering
      setCardPosition({ top: "auto", left: "50%" });
      return;
    }

    // Desktop: Smart positioning with viewport boundary detection
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeMargin = 16;
    const cardWidth = cardRef.current?.offsetWidth || 360;
    const cardHeight = cardRef.current?.offsetHeight || 100;

    let centerX = position?.x ?? viewportWidth / 2;
    let y = position?.y ? position.y - cardHeight - 12 : 10;

    // Constrain to viewport by center coordinates
    const minCenterX = safeMargin + cardWidth / 2;
    const maxCenterX = viewportWidth - safeMargin - cardWidth / 2;
    if (centerX < minCenterX) {
      centerX = minCenterX;
    }
    if (centerX > maxCenterX) {
      centerX = maxCenterX;
    }

    if (y + cardHeight + safeMargin > viewportHeight) {
      y = position?.y ? position.y + 12 : viewportHeight - cardHeight - safeMargin;
    }
    if (y < safeMargin) {
      y = safeMargin;
    }

    setCardPosition({ top: `${y}px`, left: `${centerX}px` });
  }, [position]);

  const handleReactionHover = useCallback((type: ReactionKey) => {
    setActiveReaction(type);
    triggerHaptic("light");
  }, []);

  const handleReactionSelect = useCallback(
    (type: ReactionKey) => {
      onReact(type);
      setIsDragging(false);
    },
    [onReact]
  );

  const handleCardPointerMove = useCallback((e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cardWidth = rect.width;
    const reactionWidth = cardWidth / REACTION_KEYS.length;
    const index = Math.floor(x / reactionWidth);

    if (index >= 0 && index < REACTION_KEYS.length) {
      const reaction = REACTION_KEYS[index];
      if (reaction !== activeReaction) {
        setActiveReaction(reaction);
        setIsDragging(true);
        triggerHaptic("light");
      }
    }
  }, [activeReaction]);

  const handleCardPointerDown = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCardPointerUp = useCallback(() => {
    if (isDragging && activeReaction) {
      onReact(activeReaction);
    }
    setIsDragging(false);
  }, [isDragging, activeReaction, onReact]);

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
          "pointer-events-auto overflow-visible",
          isMobile && "bottom-16 left-1/2 -translate-x-1/2"
        )}
        style={
          isMobile
            ? {
              width: "min(100vw - 32px, 100%)",
              maxWidth: "calc(100vw - 32px)",
              animation: isClosing
                ? "reactionCardExit 150ms ease-out forwards"
                : "reactionCardEnter 100ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }
            : {
              top: cardPosition.top,
              left: cardPosition.left,
              transform: "translateX(-50%)",
              animation: isClosing
                ? "reactionCardExit 150ms ease-out forwards"
                : "reactionCardEnter 100ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }
        }
        onClick={(e) => e.stopPropagation()}
        onPointerMove={handleCardPointerMove}
        onPointerDown={handleCardPointerDown}
        onPointerUp={handleCardPointerUp}
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
                animation: `reactionIconEnter 100ms ease-out ${index * 25}ms both`,
                ...(isSelected
                  ? {
                    backgroundColor: colors?.bg,
                    boxShadow: `0 0 0 3px ${colors?.ring}, 0 0 12px ${colors?.ring}80`,
                    color: colors?.text,
                    transform: 'scale(1.08)',
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
            transform: scale(0.7) translateY(10px);
            will-change: transform, opacity;
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
            transform: scale(0.75);
          }
        }

        @keyframes reactionIconEnter {
          0% {
            opacity: 0;
            transform: scale(0.5) rotateZ(-15deg);
            will-change: transform, opacity;
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
