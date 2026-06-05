
## Goal

Harden the platform for mobile users: fix bugs, tighten UX/UI, then add two small navigation conveniences (swipe-to-toggle hamburger, logo → About).

---

## Part 1 — Bugs & stability (P0)

1. **Reaction picker stale reference** — `ReferenceError: handleReactionHover is not defined` still surfaces in `ReactionPickerButton.tsx`. Trace the dead handler, remove or inline it, and add a `CardErrorBoundary` fallback around the reactions row so a single card never blanks the feed.
2. **Guest-safe realtime** — `BottomNav` + `useNotifications` open a Supabase realtime channel on `notifications` even when `user` is null, throwing 401s. Guard the subscription on `user?.id`.
3. **Reaction count drift** — after the recent optimistic fix, verify counts on: double‑tap same reaction, switch reaction, offline → online, and after pull‑to‑refresh. Reconcile from server response in `useCardReactions`.
4. **Long‑press preview** — re-verify the global `contextmenu` suppression doesn't break copy inside article body (`.prose`, `article`).

## Part 2 — Mobile UX/UI sweep (P1)

Scope: 360–414px, RTL, iOS + Android Chrome.

- **Bottom nav**: respect `env(safe-area-inset-bottom)` on notched iOS PWA; raise active-state contrast to WCAG AA; ensure 44×44 hit targets.
- **Header**: enlarge search input + avatar hit targets to 44px; keep current 52px bar.
- **Article card**: add `loading="lazy"` + `decoding="async"` to covers, `React.memo` the card, clamp title to 2 lines, tag overflow → `…`, normalize action‑row spacing (≥ 8px between icons).
- **Reaction picker**: clamp to viewport so it never clips on 320–360px; flip side near right edge.
- **Comment sheet**: lift input above the on‑screen keyboard (`visualViewport` listener), lock body scroll while open, dismiss on outside tap (consistent with `interaction-dismissal-logic` memory).
- **WritingMotivationBanner**: hide while header is collapsing to avoid overlap.
- **Number formatting**: run every visible count through `toPersianNumber` (audit `ArticleCardMetrics`, follower badges, notifications dot).
- **End‑of‑feed text**: use `text-muted-foreground` so it stays visible in light theme.

## Part 3 — Performance (P1)

- Dedupe `useSmartFeed` vs `usePublishedArticles` on `/` (shared query key).
- Compress cover uploads (already wired) — verify it runs on the editor's drop handler.
- Run `browser--performance_profile` on `/` and `/article/:id`; flag any > 50ms re‑renders.

## Part 4 — PWA / offline (P2)

- Confirm `sw-push.js` bypasses `/~oauth` (memory `pwa-oauth-denylist`).
- Verify `OfflineFallback` renders when navigator is offline at boot.

## Part 5 — Navigation conveniences (last priority)

A. **Swipe to toggle hamburger menu**
   - Add a global `useSwipeMenu` hook mounted in `AppLayout`.
   - Listens to `touchstart` / `touchend` on the main scroll container.
   - In RTL: swipe **left → right** (deltaX > 60, |deltaY| < 40, duration < 400ms) opens the menu; swipe **right → left** closes it.
   - Disabled when:
     - route starts with `/write` or `/article/.../edit` (writing page),
     - target is inside `input, textarea, [contenteditable]`, a `Carousel`, the reaction picker, or any element with `data-no-swipe`,
     - a modal/sheet is open (check `document.body` lock or `[data-state="open"]` on Radix overlays).
   - Expose `openMenu` / `closeMenu` from `Header` via a tiny context (or lift menu state into `AppLayout`) so the hook can drive it.

B. **Logo → About**
   - In `Header.tsx` menu panel header, wrap the "نوبهار" title (and ideally the logo) in `<Link to="/about">` that also calls `smoothCloseMenu()`.
   - If the user means the top‑bar (currently no visible "نوبهار" text in the 52px header — only avatar/search/burger), add a small centered logo+wordmark linking to `/about`, behind a feature check so it doesn't crowd 360px screens. Confirm with user if they want it in the top bar too.

---

## Technical notes

- New hook: `src/hooks/useSwipeMenu.ts` (pure DOM, no deps).
- Lift menu open state from `Header` into a `MenuContext` provider in `AppLayout` so swipes can toggle it.
- All new strings localized (Persian), all counts via `toPersianNumber`.
- No DB migration required for this batch.
- No edits to `src/integrations/supabase/{client,types}.ts`.

## Open question

The current top bar shows the burger, search, and avatar — there's no "نوبهار" wordmark in the header itself, only inside the slide‑in menu. Do you want the wordmark added to the top bar (linking to `/about`), or is wiring the existing menu‑panel "نوبهار" title to `/about` enough?
