# LinkedIn-Style Reaction System Upgrade Plan

**Focus:** Mobile/Android Experience  
**Date:** April 17, 2026  
**Status:** Planning Phase

---

## Executive Summary

Redesign the complete reaction system (frontend & backend) to match LinkedIn's professional, smooth interaction pattern:
- **Single tap** on reaction button = Like (default reaction)
- **Long press** (hold) = Opens floating reaction card with smooth transitions
- **Smooth gesture scrolling** through reactions in the card
- **Instant card closure** upon reaction selection
- **Haptic feedback** on mobile for premium feel

---

## Current State Assessment

### Frontend Components
- **ReactionPicker.tsx** - Main interaction component with bottom-sheet on mobile
- **ArticleReactions.tsx** - Displays reaction summary & integrates picker
- **ReactionDetailsModal.tsx** - Shows who reacted with filtering
- **ReactionIcons.tsx** - SVG icon components with animations
- **reactions.css** - Animation definitions

### Backend Database
- **reactions table** with columns:
  - `id` (UUID, PK)
  - `article_id` (UUID, FK)
  - `user_id` (UUID) 
  - `reaction_type` (TEXT: 'like', 'love', 'insightful', 'laugh', 'sad')
  - `created_at` (TIMESTAMP)
  - **UNIQUE constraint** on (article_id, user_id)

### Current Behavior
- Long press on reaction button opens a full bottom sheet
- Shows reaction grid with labels (5 reactions)
- Tap to select, then closes
- Animation-based transitions

---

## LinkedIn Behavior Analysis

### Mobile Interaction Pattern

```
┌─────────────────────────────────────────────┐
│  INITIAL STATE                              │
│  User sees article with reaction button     │
│  Single thumbs-up icon (no label)           │
└─────────────────────────────────────────────┘
                    │
               (QUICK TAP)
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  ACTION: LIKE                               │
│  Reaction button briefly animates           │
│  Count increments (with animation)          │
│  Keyboard closed (if open)                  │
└─────────────────────────────────────────────┘
                    │
               (HOLD: 300-400ms)
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  REACTION POPUP CARD                        │
│                                             │
│  ╔════════════════════════════════════════╗ │
│  ║  👍 ❤️  💡  😄  😔                    ║ │
│  ║  Like Love Think Haha Sad              ║ │
│  ╚════════════════════════════════════════╝ │
│                                             │
│  • Floats near finger                      │
│  • Circular/pill-shaped layout             │
│  • No background/minimal shadow            │
│  • Animations: Scale-in, staggered icons  │
└─────────────────────────────────────────────┘
                    │
            (SCROLL/SWIPE FINGER)
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  SMOOTH HIGHLIGHT                          │
│  • Active reaction scales up slightly       │
│  • Color highlight appears                 │
│  • Haptic feedback on hover (optional)     │
│  • NO "open keyboard" behavior             │
└─────────────────────────────────────────────┘
                    │
          (LIFT FINGER / TAP REACTION)
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  CARD CLOSES INSTANTLY                      │
│  • Reaction updates immediately            │
│  • Small pop animation on button            │
│  • Count updates with number animation     │
│  • Card dismisses with fade-scale          │
└─────────────────────────────────────────────┘
```

### Key UX Principles
1. **Two modes:** Single tap = Like / Long hold = Picker
2. **Minimal UI:** No text labels in floating card (icons only - mobile focus)
3. **Smooth gestures:** Swiping through reactions feels natural
4. **Zero lag:** Instant visual feedback
5. **Context aware:** No keyboard interference
6. **Touch-first:** Optimized for fingers, not mouse hover

---

## Implementation Plan

### Phase 1: Database & Backend (Backend Team)

#### 1.1 Update Reactions Table Constraints
- **Current:** CHECK constraint allows specific reaction types
- **No change needed:** Table structure is already compatible
- **Action:** Ensure all edge cases are handled in RLS policies

#### 1.2 Create/Update REST Endpoints

**Endpoint: POST /react** (or RPC function `toggle_reaction`)
```sql
Function: toggle_reaction(
  p_article_id UUID,
  p_reaction_type TEXT
) RETURNS JSON

Logic:
  - Check if user has existing reaction
  - If same type: DELETE
  - If different type: UPDATE
  - If none: INSERT
  - Return: { 
      user_reaction: TEXT | NULL,
      total_count: INT,
      top_reactions: {type: count}[] 
    }
```

**Endpoint: GET /articles/:id/reactions/summary**
```sql
Returns summary of reactions (for quick loads):
  {
    topTypes: ReactionKey[],    // Top 3-5 reactions by count
    totalCount: INT,
    userReaction: ReactionKey | NULL,
    reactorNames: STRING[],     // Top 3 names who reacted
    countsByType: {
      like: INT,
      love: INT,
      insightful: INT,
      laugh: INT,
      sad: INT
    }
  }
```

#### 1.3 Add Tracking Events (Optional/Phase 2)
- Log reaction interactions for analytics
- Track: reaction_type, hold_duration, swipe_count

---

### Phase 2: Frontend - Core UI Components

#### 2.1 Create New `ReactionCardPicker.tsx`
**Purpose:** Small floating card with reactions (replaces bottom sheet)

**Features:**
- Positioned near tap point initially
- 5 reaction icons in horizontal row
- Icons only (no labels) on mobile
- Smooth entrance animation (scale + fade)
- Active reaction highlighted with subtle background
- Touch-optimized hit targets (min 44px)

**Props:**
```tsx
interface ReactionCardPickerProps {
  reactions: ReactionKey[];
  onReact: (type: ReactionKey) => void;
  position?: 'auto' | 'top' | 'bottom';  // Adaptive positioning
  userReaction?: ReactionKey | null;
}
```

**Animations:**
- Entrance: `scale(0.6) → scale(1)` with fade (200ms)
- Icons staggered (60ms delay each)
- Hover: Scale up 1.1x with color highlight
- Exit: Reverse scale + fade (150ms)

#### 2.2 Refactor `ReactionPickerButton.tsx`
**Purpose:** Main button with two-mode interaction

**Interaction Logic:**
```tsx
States:
  1. IDLE: Show current reaction icon or default
  2. PRESSING: Timer starts (hold detection)
  3. TAP_COMPLETE (<300ms): Toggle like reaction
  4. HOLD_COMPLETE (>400ms): Show card

Events:
  - pointerdown: Start timer
  - pointerup: 
    - If <300ms: Execute tap action
    - If ≥400ms: Already showing card
    - Cancel timer
  - pointermove: Track finger position for card placement
  - pointercancel: Clear timer
```

**Mobile Optimizations:**
- Use `touch-action: manipulation` to prevent double-tap zoom
- Haptic feedback: Brief vibration on hover (navigator.vibrate)
- Prevent default scroll behavior during interaction
- No keyboard trigger

#### 2.3 Update `ArticleReactions.tsx`
**Purpose:** Container for reaction button + summary display

**Changes:**
- Import new `ReactionCardPicker` instead of bottom sheet
- Simplify interaction handler
- Update position logic for inline card

#### 2.4 Update `ReactionIcons.tsx`
**Purpose:** Icon components maintain but optimize for card display

**Changes:**
- Add `size="compact"` variant for small card icons
- Ensure proper stroke widths for small sizes
- Add smooth color transition animations
- Remove unnecessary animation complexity for mobile

---

### Phase 3: Styling & Animations

#### 3.1 Update `reactions.css`

**New Animations:**

```css
/* Floating card entrance */
@keyframes reaction-card-enter {
  0% {
    opacity: 0;
    transform: scale(0.6) translateY(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Staggered icon entry */
@keyframes reaction-icon-enter {
  0% {
    opacity: 0;
    transform: scale(0.4) rotateZ(-15deg);
  }
  100% {
    opacity: 0.85;
    transform: scale(1) rotateZ(0);
  }
}

/* Reaction highlight on hover */
@keyframes reaction-highlight {
  0% { background: transparent; }
  100% { background: hsl(var(--primary) / 0.1); }
}

/* Active reaction scale */
@keyframes reaction-active {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1.05); }
}

/* Card exit animation */
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

/* Reaction button pop (when reaction selected) */
@keyframes reaction-button-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
```

#### 3.2 Mobile-Specific CSS

```css
/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  /* Disable 300ms tap delay */
  touch-action: manipulation;
  
  /* Larger hit targets */
  .reaction-button { min-width: 44px; min-height: 44px; }
  
  /* Reduce animation complexity on lower-end devices */
  @media (prefers-reduced-motion: reduce) {
    [class*="reaction"] {
      animation-duration: 100ms !important;
    }
  }
}

/* Adaptive card positioning */
@media (max-height: 600px) {
  .reaction-card {
    position: fixed;
    bottom: 16px;  /* Ensure visible on small screens */
  }
}
```

#### 3.3 Dark/Light Theme Support
- Ensure reaction card has proper contrast
- Update shadow for floating effect in both themes
- Test on OLED displays (reaction colors should work)

---

### Phase 4: Mobile-Specific Features

#### 4.1 Haptic Feedback
**When to trigger:**
- Long press start (light vibration: 10ms)
- Reaction hover in card (light: 5ms)
- Reaction selection (medium: 30ms)

**Implementation:**
```tsx
// Check support
if (navigator.vibrate) {
  navigator.vibrate(10);  // Light feedback
  navigator.vibrate([10, 5, 10]);  // Pattern
}
```

#### 4.2 Gesture Support (Optional/Phase 2)
- **Swipe left/right:** Cycle through reactions
- **Swipe down:** Close card without reacting
- **Double-tap:** Fast like toggle

#### 4.3 Performance Optimizations
- Lazy load reaction icons until card opens
- Debounce reaction updates (batch writes)
- Memoize reaction components to prevent unnecessary re-renders
- Use `will-change: transform` for animated elements

---

### Phase 5: Testing & QA

#### 5.1 Device Testing
- **Android:** Chrome, Samsung Internet, Firefox
- **iOS:** Safari, Chrome
- **Screen sizes:** 320px - 768px width
- **Touch patterns:** Single tap, long press, drag, swipe

#### 5.2 Test Scenarios

1. **Tap Detection**
   - [ ] Single tap toggles like
   - [ ] Reaction updates immediately
   - [ ] Count increments/decrements

2. **Long Press**
   - [ ] Card appears at 400ms
   - [ ] No accidental scrolling
   - [ ] Card doesn't trigger selection on appearance

3. **Card Interaction**
   - [ ] Hover highlights reactions
   - [ ] Swipe through reactions smooth
   - [ ] Touch outside closes card
   - [ ] Card closes on selection

4. **Edge Cases**
   - [ ] Rapid taps don't duplicate reactions
   - [ ] Changing reaction from one to another works
   - [ ] Offline mode queues reaction
   - [ ] Network error shows retry

5. **Performance**
   - [ ] Card renders in <100ms
   - [ ] Animations smooth 60fps
   - [ ] No lag when scrolling feed
   - [ ] Memory doesn't leak on repeated opens

---

## File Structure Changes

```
src/
├── components/
│   └── articles/
│       ├── ReactionPickerButton.tsx        [NEW]
│       ├── ReactionCardPicker.tsx          [NEW]
│       ├── ReactionPicker.tsx              [REFACTOR - simplified]
│       ├── ArticleReactions.tsx            [UPDATE - use new components]
│       ├── ReactionDetailsModal.tsx        [KEEP - unchanged]
│       ├── ReactionIcons.tsx               [UPDATE - add variants]
│       └── ReactionDetailsModal.tsx
├── hooks/
│   ├── useCardReactions.ts                 [UPDATE - backend calls]
│   └── useReactions.ts                     [DEPRECATE/REMOVE]
├── styles/
│   └── reactions.css                       [UPDATE - new animations]
├── lib/
│   └── haptics.ts                          [NEW - optional]
└── types/
    └── reactions.ts                        [NEW - if needed]

supabase/
├── functions/
│   └── toggle-reaction/                    [NEW or UPDATE]
└── migrations/
    └── [date]_enhance_reactions_rls.sql    [NEW - if needed]
```

---

## Implementation Timeline

### Week 1: Backend
- [ ] Create/update REST endpoints
- [ ] Test database functions
- [ ] Add RLS security checks

### Week 2: Frontend - Core
- [ ] Build `ReactionCardPicker.tsx`
- [ ] Refactor `ReactionPickerButton.tsx`
- [ ] Integrate with existing components
- [ ] Test tap/long-press detection

### Week 3: Styling & UX
- [ ] Implement animations
- [ ] Add haptic feedback
- [ ] Mobile CSS optimizations
- [ ] Theme compatibility

### Week 4: Testing & Polish
- [ ] Device testing (Android, iOS)
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Documentation

---

## Key Technical Decisions

### 1. **Touch Detection Approach**
- ❌ Click + Hold (unreliable on mobile)
- ✅ Pointer Events (pointerdown/up/move/cancel)
- Property: `touch-action: manipulation`

### 2. **Card Positioning**
- ❌ Fixed to center (blocks content)
- ✅ Floating near gesture point, adaptive bottom placement
- Fallback to bottom sheet on very small screens

### 3. **Animation Performance**
- ❌ DOM-based transitions (janky)
- ✅ CSS transforms (hardware-accelerated)
- Property: `will-change: transform`

### 4. **State Management**
- Keep in React state (useState)
- Single source of truth: `useCardReactions` hook
- Optimization: Memoize reaction picker

### 5. **Offline Support**
- Queue reactions locally
- Sync when online
- Use existing background sync system

---

## Success Metrics

- **Performance:** Card opens in <100ms
- **Smoothness:** 60fps animations on mid-range devices
- **Engagement:** +15-20% reaction interactions (trend)
- **UX:** Session time increase (passive metric)
- **Errors:** Zero crash on tap/long-press
- **Mobile-first:** Works flawlessly on 320px+ screens

---

## Rollout Strategy

### Stage 1: Android Beta (Internal Only)
- Test with team members
- Gather feedback
- Monitor crash reports

### Stage 2: Public Android Beta
- 10-20% of Android users
- A/B test vs current system
- Monitor analytics

### Stage 3: Full Android Release
- 100% of Android users
- Monitor adoption metrics

### Stage 4: iOS Rollout
- Follow same 3-stage approach
- Adjust for iOS-specific behavior

### Fallback Plan
- Keep existing bottom sheet as fallback
- Feature flag to switch between implementations
- Rollback in <1 hour if critical issues

---

## Dependencies & Tools

- **React:** pointer events, state management
- **Tailwind CSS:** responsive utilities
- **TypeScript:** type safety
- **Supabase:** real-time updates (if using listen)
- **Lucide React:** icon library (already in use)

---

## Notes & Considerations

1. **Accessibility:**
   - Keyboard navigation for desktop fallback
   - ARIA labels for screen readers
   - Test with accessibility tools

2. **Browser Compatibility:**
   - Pointer Events: IE 11+ (not needed for mobile)
   - CSS Grid: All modern browsers
   - Haptics: Navigator.vibrate (requires https)

3. **Internationalization:**
   - Remove text labels from card (emojis universal)
   - Keep existing labels in summary
   - RTL layout already supported

4. **Future Enhancements:**
   - Custom emoji reactions (user uploads)
   - Reaction animations (lottie)
   - Analytics dashboard (who reacted when)
   - Sound effects (optional)
   - Swipe gestures (gesture library)

---

## Questions for Clarification

1. Should we support custom reactions in Phase 1, or Phase 2?
2. Do we need real-time reaction updates (via Supabase listen)?
3. Should we add reaction counts next to each reaction in the floating card?
4. Do we want swipe gestures for cycling through reactions?
5. Any specific animation feel preference (spring vs linear)?

---

**Document Version:** 1.0  
**Last Updated:** April 17, 2026  
**Next Review:** After Phase 1 completion
