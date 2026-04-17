# LinkedIn Reaction System - Code Architecture & Implementation Guide

## Architecture Overview

### Component Hierarchy

```tsx
// HIGH-LEVEL STRUCTURE

<ArticleReactions>
  ├── Reaction Summary Display
  ├── <ReactionPickerButton> ← MAIN INTERACTION
  │   ├── [Tap Logic] → Toggle Like
  │   ├── [Hold Logic] → Show Card
  │   └── <ReactionCardPicker> ← FLOATING CARD
  │       ├── Card Container
  │       ├── Reaction Icons (5)
  │       └── Touch Handlers
  └── Details Modal (unchanged)
```

---

## New Components Implementation

### 1. **ReactionPickerButton.tsx** (NEW)

**Purpose:** Main button component handling tap/long-press logic

```tsx
interface ReactionPickerButtonProps {
  userReaction?: ReactionKey | null;
  onReact: (type: ReactionKey) => void;
  count?: number;
  reactorNames?: string[];
}

export function ReactionPickerButton({
  userReaction,
  onReact,
  count = 0,
  reactorNames = []
}: ReactionPickerButtonProps) {
  // State
  const [showCard, setShowCard] = useState(false);
  const [cardClosing, setCardClosing] = useState(false);
  const [pointPosition, setPointPosition] = useState<{x: number, y: number} | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Interaction Constants
  const TAP_THRESHOLD = 300; // ms - threshold between tap and long press
  const LONG_PRESS_DURATION = 400; // ms - how long to hold before showing card

  // Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get position for card placement
    const rect = buttonRef.current?.getBoundingClientRect();
    setPointPosition({
      x: rect?.left || e.clientX,
      y: rect?.top || e.clientY
    });

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setShowCard(true);
      longPressTimer.current = null;
      triggerHaptic('light'); // Optional: vibration
    }, LONG_PRESS_DURATION);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (longPressTimer.current) {
      // TAP detected (<300ms)
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;

      // Tap action: toggle like
      if (userReaction === 'like') {
        onReact('like'); // Remove like
      } else if (!userReaction) {
        onReact('like'); // Add like
      } else {
        // Has different reaction - show card to change
        setShowCard(true);
      }
      triggerHaptic('medium');
      return;
    }

    // LONG PRESS was already detected, card already open
    // Nothing to do here
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const closeCard = useCallback(() => {
    setCardClosing(true);
    setTimeout(() => {
      setShowCard(false);
      setCardClosing(false);
    }, 150); // Animation duration
  }, []);

  const handleReactionSelect = (type: ReactionKey) => {
    onReact(type);
    closeCard();
    triggerHaptic('medium');
  };

  // Render
  return (
    <div className="relative flex items-center gap-1.5">
      {/* Main reaction button */}
      <button
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={cn(
          "flex items-center justify-center gap-1",
          "px-3 py-2 rounded-lg",
          "touch-none select-none",
          "hover:bg-muted/50 active:scale-95",
          "transition-all duration-200",
          userReaction && "bg-primary/10"
        )}
        style={userReaction ? {
          borderColor: REACTION_COLORS[userReaction]?.ring,
        } : {}}
      >
        {/* Icon */}
        <ReactionIconComponent 
          type={userReaction || 'like'}
          size={18}
          animated={!!userReaction}
        />
        
        {/* Count badge */}
        {count > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Floating Card - Conditional Render */}
      {showCard && (
        <ReactionCardPicker
          onReact={handleReactionSelect}
          onClose={closeCard}
          userReaction={userReaction}
          position={pointPosition}
          isClosing={cardClosing}
        />
      )}

      {/* Styles */}
      <style>{`
        @keyframes reaction-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
```

**Key Features:**
- ✅ Pointer Events (works on all touch devices)
- ✅ Tap/long-press detection
- ✅ Position tracking for card placement
- ✅ Haptic feedback hooks
- ✅ Smooth animations

---

### 2. **ReactionCardPicker.tsx** (NEW)

**Purpose:** Small floating card with 5 reactions

```tsx
interface ReactionCardPickerProps {
  onReact: (type: ReactionKey) => void;
  onClose: () => void;
  userReaction?: ReactionKey | null;
  position?: { x: number; y: number } | null;
  isClosing?: boolean;
}

export function ReactionCardPicker({
  onReact,
  onClose,
  userReaction,
  position,
  isClosing = false
}: ReactionCardPickerProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeReaction, setActiveReaction] = useState<ReactionKey | null>(userReaction || null);

  // Close on backdrop click
  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate trigger
    const timerId = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [onClose]);

  // Prevent scroll while card is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleReactionHover = (type: ReactionKey) => {
    setActiveReaction(type);
    triggerHaptic('light'); // Vibrate on hover
  };

  const handleReactionSelect = (type: ReactionKey) => {
    onReact(type);
  };

  // Calculate card position (adaptive)
  const cardStyle: React.CSSProperties = {
    animation: isClosing 
      ? 'reactionCardExit 150ms ease-out forwards' 
      : 'reactionCardEnter 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
  };

  // Mobile: Center at bottom, Desktop: Near mouse
  const isMobile = window.innerWidth < 640;
  const containerClass = isMobile 
    ? 'fixed bottom-16 left-1/2 -translate-x-1/2'
    : 'fixed';

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Card Container */}
      <div
        ref={cardRef}
        className={cn(
          "fixed z-50",
          "flex items-center gap-2",
          "px-3 py-2.5",
          "bg-card rounded-full",
          "shadow-lg border border-border",
          "pointer-events-auto",
          containerClass
        )}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {REACTION_KEYS.map((key, index) => {
          const isActive = activeReaction === key;
          const isSelected = userReaction === key;
          const colors = REACTION_COLORS[key];

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
                ...(isSelected ? {
                  backgroundColor: colors?.bg,
                  boxShadow: `0 0 0 2px ${colors?.ring}`,
                } : {}),
              }}
            >
              <ReactionIconComponent
                type={key}
                size={24}
                animated={isActive || isSelected}
                className="reaction-icon"
              />
            </button>
          );
        })}
      </div>

      {/* Animations */}
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
            transform: scale(0.4) rotate(-20deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }
      `}</style>
    </>
  );
}
```

**Key Features:**
- ✅ Floating card near tap point
- ✅ Staggered icon animations
- ✅ Hover highlighting with haptic
- ✅ Quick selection + close
- ✅ Mobile/desktop adaptive

---

### 3. **Integration with ArticleReactions.tsx**

**Changes:**
```tsx
// OLD
import { ReactionPicker } from "./ReactionPicker";

// NEW
import { ReactionPickerButton } from "./ReactionPickerButton";

export function ArticleReactions({ articleId, summary, ...props }) {
  const { toggleReaction } = useCardReactions(articleId);
  
  return (
    <div className="flex items-center gap-4">
      {/* NEW: More compact, responsive button */}
      <ReactionPickerButton
        userReaction={summary?.userReaction}
        onReact={toggleReaction}
        count={summary?.totalCount}
        reactorNames={summary?.reactorNames}
      />
      
      {/* Comments section - unchanged */}
      <CommentButton {...props} />
    </div>
  );
}
```

---

## Hook Updates

### useCardReactions.ts - What Stays

```tsx
// KEEP THIS (core logic works)
export function useCardReactions(articleId: string, autoFetch = true) {
  const [summary, setSummary] = useState<ReactionSummary>(...);
  
  const toggleReaction = async (type: ReactionKey) => {
    // Optimistic update
    // Database write
    // Error handling
  };

  return { summary, toggleReaction, loading };
}
```

### NEW: Backend Integration (RPC)

```tsx
// In useCardReactions or new integration hook
const toggleReaction = async (type: ReactionKey) => {
  try {
    const { data: result } = await supabase.rpc('toggle_reaction', {
      p_article_id: articleId,
      p_reaction_type: type,
    });

    // Update local state with response
    setSummary({
      userReaction: result.user_reaction,
      totalCount: result.total_count,
      topTypes: result.top_types,
      ...
    });
  } catch (error) {
    // Handle error
  }
};
```

---

## CSS Animations

### New animations.css

```css
/* Card Entrance */
@keyframes reaction-card-enter {
  0% {
    opacity: 0;
    transform: scale(0.6) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Card Exit */
@keyframes reaction-card-exit {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* Icon Stagger */
@keyframes reaction-icon-enter {
  0% {
    opacity: 0;
    transform: scale(0.4) rotateZ(-15deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateZ(0deg);
  }
}

/* Icon Hover */
@keyframes reaction-scale-up {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}

/* Button Pop */
@keyframes reaction-button-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* Smooth transitions */
.reaction-card {
  transition: all 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reaction-icon-button {
  transition: all 150ms ease-out;
  will-change: transform;
}
```

---

## Haptic Feedback Utility

### lib/haptics.ts (NEW)

```tsx
export function triggerHaptic(intensity: 'light' | 'medium' | 'heavy') {
  if (!navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    light: 5,
    medium: 15,
    heavy: [10, 5, 15],
  };

  try {
    navigator.vibrate(patterns[intensity]);
  } catch (e) {
    console.debug('Haptic feedback not supported');
  }
}

export function hoverHaptic() {
  triggerHaptic('light');
}

export function selectHaptic() {
  triggerHaptic('medium');
}

export function errorHaptic() {
  triggerHaptic('heavy');
}
```

---

## Mobile CSS Optimizations

### Add to reactions.css

```css
/* Mobile Touch Optimizations */
@media (hover: none) and (pointer: coarse) {
  /* Remove tap delay */
  button[class*="reaction"] {
    touch-action: manipulation;
  }

  /* Larger touch targets */
  .reaction-button {
    min-width: 44px;
    min-height: 44px;
  }

  /* Prevent zoom on double-tap */
  input, select, textarea, button {
    font-size: 16px; /* Prevents auto-zoom on iOS */
  }

  /* Active state feedback */
  .reaction-button:active {
    transform: scale(0.95);
  }

  /* Reduce motion for performance */
  @media (prefers-reduced-motion: reduce) {
    [class*="reaction"] {
      animation-duration: 100ms !important;
    }
  }
}

/* Adaptive card sizing */
@media (max-height: 600px) {
  .reaction-card {
    position: fixed;
    bottom: 12px !important;
    top: auto !important;
  }
}

@media (min-width: 640px) {
  .reaction-card {
    position: absolute;
    bottom: auto;
  }
}
```

---

## Testing Checklist

### Unit Tests (for components)
```tsx
// ReactionPickerButton.test.tsx
describe('ReactionPickerButton', () => {
  it('should toggle like on quick tap', async () => {
    // Test <300ms tap = like toggle
  });

  it('should show card on long press', async () => {
    // Test >400ms hold = card appears
  });

  it('should close card on selection', () => {
    // Test card closes after reaction selected
  });
});

// ReactionCardPicker.test.tsx
describe('ReactionCardPicker', () => {
  it('should highlight on hover', () => { ... });
  it('should close on backdrop click', () => { ... });
  it('should not close on double tap', () => { ... });
});
```

### Integration Tests
```tsx
// Full flow from ArticleReactions
describe('Reaction System E2E', () => {
  it('should complete reaction flow: tap -> like -> count update', () => {
    // Full user journey
  });

  it('should change reaction: different type selection', () => {
    // Tap once for like, then long press to change to love
  });
});
```

### Device Testing
```
- [ ] Android Chrome: Tap detection
- [ ] Android Chrome: Long press trigger
- [ ] Android Chrome: Card swipe
- [ ] iOS Safari: Tap detection
- [ ] iOS Safari: Long press (might be 2D touch)
- [ ] iOS Safari: Haptic feedback
- [ ] Low-end device: Performance (60fps)
- [ ] Network throttle: Offline queue
```

---

## Performance Considerations

### Optimization Strategies

```tsx
// 1. Memoize card picker to prevent unnecessary re-renders
const ReactionCardPickerMemo = memo(ReactionCardPicker, (prev, next) => {
  return prev.userReaction === next.userReaction && 
         prev.isClosing === next.isClosing;
});

// 2. Lazy load icons until card opens
const ReactionIcon = lazy(() => import('./ReactionIcon'));

// 3. Use transform instead of width/height
// CSS:
.reaction-card {
  will-change: transform; /* Hint to browser for GPU acceleration */
}

// 4. Debounce haptic calls
const debouncedHaptic = useMemo(
  () => debounce(() => triggerHaptic('light'), 50),
  []
);
```

---

## Rollout & Monitoring

### Feature Flag Implementation

```tsx
// components/articles/ReactionPickerButton.tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { ReactionPickerButtonLegacy } from './ReactionPickerButtonLegacy';

export function ReactionPickerButton(props) {
  const useLinkedInStyle = useFeatureFlag('linkedin_reactions');

  if (!useLinkedInStyle) {
    return <ReactionPickerButtonLegacy {...props} />;
  }

  // New implementation
  return ...
}
```

### Analytics Events

```tsx
// Track interactions
const trackReactionTap = () => {
  analytics.track('reaction_tapped', {
    type: userReaction,
    duration_ms: tapDuration,
  });
};

const trackCardOpened = () => {
  analytics.track('reaction_card_opened', {
    trigger: 'long_press',
    duration_until_selection_ms: Date.now() - pressStartTime,
  });
};
```

---

## Migration Checklist

- [ ] Backend: Create `toggle_reaction()` RPC function
- [ ] Create `ReactionPickerButton.tsx`
- [ ] Create `ReactionCardPicker.tsx`
- [ ] Update `ArticleReactions.tsx` integration
- [ ] Add haptics utility
- [ ] Update CSS animations
- [ ] Mobile CSS optimizations
- [ ] Feature flag implementation
- [ ] Unit & integration tests
- [ ] Device testing (3+ Android, 2+ iOS)
- [ ] Performance profiling
- [ ] Analytics integration
- [ ] Documentation
- [ ] Staged rollout (10% → 50% → 100%)

---

**Document Purpose:** Technical implementation guide for developers  
**Last Updated:** April 17, 2026  
**Estimated Dev Time:** 10-12 days (full stack)
