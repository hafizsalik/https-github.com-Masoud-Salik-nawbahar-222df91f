# Mobile-First Production Upgrade — نوبهار

Focused on the 390px viewport (where most users are). Inspired by Medium (reading focus, claps depth), LinkedIn (reaction tray), Twitter/X (action sheets), and Instagram (not-interested feedback loop).

---

## Phase 1 — Bug Fixes (P0)

1. **`hidden_articles` is dead code.** `ArticleActionsMenu.handleNotInterested` writes to localStorage, but `useSmartFeed` never reads it. Articles reappear after refresh. Wire `useSmartFeed` (and `useExploreArticles`) to filter out hidden IDs.
2. **`reported_articles` cast as `any`.** Forces unsafe insert and silent type drift. Regenerate types and remove the cast.
3. **Two competing theme sources of truth.** `useTheme.ts` exists but `Header.tsx` re-implements its own `isDark` state with direct localStorage writes. Switching theme from one place can desync the other. Consolidate on `useTheme`.
4. **Notifications N+1.** `useNotificationExtras` fires a `select` per comment/reaction notification (up to 40 round-trips on open). Batch with `.in('article_id', [...])` + client-side group.
5. **Reaction toggle double-fetch.** `toggleReaction` calls `fetchReactions()` after every successful RPC, throwing away the optimistic update for a full refetch. Trust the RPC return value; only refetch on error.
6. **Bookmark check repeated per card.** `ArticleActionsMenu` queries `bookmarks` on every sheet open. Centralize into a `useBookmarks()` set hook (single query, cached) shared with article page.
7. **Share fallback throws on iOS PWAs without clipboard permission.** Wrap in try/catch and toast a graceful fallback.

---

## Phase 2 — Reactions, Refined

Building on the existing 6-reaction LinkedIn-style system.

- **Long-press threshold** lowered to 250ms (currently feels sluggish on mid-range Androids); add subtle haptic pulse on tray open via existing `lib/haptics.ts`.
- **Tray as bottom sheet on mobile** (≤640px) with safe-area padding, 56px touch targets, Persian label always visible (not just on hover). Tray on desktop stays as floating popover.
- **Selected ring** on the user's current reaction inside the tray.
- **Card summary**: show the top reaction emoji + count, plus 2 stacked avatars of followed reactors when available (social proof). Tap opens `ReactionDetailsModal`.
- **Article page**: reaction bar gets a tabbed details modal (All / by type), like LinkedIn.
- **Undo toast** on accidental reaction (3-second window).
- **Guest tap** opens a soft auth sheet (not a hard redirect): "برای واکنش وارد شوید" with inline login button.

---

## Phase 3 — Action Semantics: Save / Share / Report / Not-Interested

Define what actually happens, end-to-end. Today most are toast-only.

### Save (Bookmark)
- Optimistic toggle, single source of truth via `useBookmark`.
- Success toast with **"مشاهده ذخیره‌ها"** action → `/bookmarks`.
- Bookmarked state visually persists on the card (filled icon).
- Offline-safe: queue via existing `backgroundSync` if no network.

### Share
- Native `navigator.share` first; fallback to clipboard with toast.
- Append UTM-style ref `?ref=share` so we can later measure share-driven traffic.
- After share, increment a local "shared" engagement signal used by `useSmartFeed` ranking.

### Not Interested (currently broken)
- Insert into a new `article_dismissals` table `(user_id, article_id, reason, created_at)` for signed-in users; localStorage fallback for guests.
- Optional follow-up chip row inside the toast: "کمتر از این نویسنده" / "کمتر از این موضوع" — feeds into feed ranking.
- Card animates out (height collapse 200ms) instead of just disappearing on next refresh.
- `useSmartFeed` and `useExploreArticles` filter dismissed IDs.

### Report
- Keep 3-step flow but move to bottom sheet (consistent with menu).
- Add **"ارسال شد"** confirmation screen with a short note about review SLA, instead of a plain toast.
- Server: trigger to notify admins (`notifications` table, `type='report'`) when a report row is created.
- Prevent duplicate reports gracefully (already partial — keep 23505 path, unify message).

---

## Phase 4 — Writing Motivation Banner — Redesign

The current banner is colorful, gradient-heavy, with a streak chip + "remaining" chip + sparkle icon + two buttons. On 390px it dominates the feed and reads as an ad.

### New direction: quiet, contextual, dismissible-for-good
- Single line, bordered card (no gradient), matches reading-surface tone.
- Format: short prompt + single ghost button "بنویسید".
- No streak/count chips in the feed banner; move those to the Profile page where users actually want stats.
- Show **at most once per session**, never above-the-fold on first scroll. After dismissal, suppress for 7 days (currently 4h, too aggressive).
- Hide entirely for users who published in the last 24h.
- Triggered placement: between feed items at position 6 (Medium-style "tip card"), not sticky-top.
- Long-form prompts move into the existing `WritingGuidanceModal`; the banner only nudges.

---

## Phase 5 — Theme Toggle, Polished

- Replace the menu row toggle with a proper segmented `[☀ روشن | 🌙 تاریک | ⚙ سیستم]` control. "System" option respects `prefers-color-scheme` and updates live.
- Smooth color transition: add `transition-colors duration-200` on `html` root via a class added during toggle (avoids flashing on every hover).
- Source of truth: `useTheme`. Header's local state is removed.
- Preserve no-FOUC: keep the inline script in `index.html` that sets the class before React mounts (verify it exists; add if missing).

---

## Phase 6 — Notifications, Polished

- **Visual**: each row uses an avatar (actor) + a small colored type-badge (heart/comment/follow/reaction) overlapping bottom-right of the avatar — the current "two icons side-by-side" reads cluttered on 390px.
- **Performance**: batch the comment/reaction lookups (Phase 1 #4) into 2 queries total.
- **Grouping**: collapse multiple reactions on the same article ("۵ نفر به مقاله شما واکنش نشان دادند") with expand-on-tap.
- **Empty state**: friendly illustration + CTA "کاوش مقالات".
- **Bottom-nav badge**: ensure it caps at "۹+" and uses brand orange (currently red conflicts with destructive semantics).
- **Settings panel** moved into a dedicated `/notifications/settings` route to declutter the list page.

---

## Phase 7 — Error Handling, Centralized

- Audit all `supabase` calls for silent failures. Standardize on a `safeCall(fn, { context })` wrapper that:
  - logs via `logger`
  - maps codes via existing `errorHandler.ts`
  - returns `{ data, error }` shape
- Replace all bare `try/catch { /* ignore */ }` (e.g. `handleNotInterested`, `handleShare`) with explicit user feedback or intentional silence.
- Wrap `Notifications`, `Article`, `Profile`, `Explore` in route-level error boundaries with retry buttons (we already have `CardErrorBoundary` for feed cards).
- Add an offline-aware toast wrapper: when offline, queue intent and show "ذخیره می‌شود وقتی آنلاین شدید".

---

## Phase 8 — Mobile UX Polish (cross-cutting)

- Tap targets audited to 44×44 minimum (current menu-dot trigger is ~14px icon in a 1px-padded button — too small).
- Bottom-sheet handle drag-to-dismiss.
- Persian numerals everywhere via `toPersianNumber` (currently inconsistent in notification settings and badges).
- `safe-bottom` padding applied to all sheets and the bottom nav (verify on iOS PWA).
- Replace `alert("لینک کپی شد")` in `Header.handleShareApp` with toast.

---

## Technical Summary

| Area | Files (primary) |
|---|---|
| Hide / dismiss feed items | `useSmartFeed.ts`, `useExploreArticles.ts`, new `article_dismissals` migration, `ArticleActionsMenu.tsx` |
| Reactions tray + summary | `ReactionPicker.tsx`, `ReactionPickerButton.tsx`, `ArticleReactions.tsx`, `useCardReactions.ts` |
| Bookmark unification | `useBookmark.ts` (extend to set-based), `ArticleActionsMenu.tsx`, `Article.tsx` |
| Report flow polish | `ArticleActionsMenu.tsx`, migration: trigger → admin notification |
| Motivation banner | `WritingMotivationBanner.tsx`, `Index.tsx`, `useWritingMotivation.ts` |
| Theme | `useTheme.ts`, `Header.tsx`, `index.html` (no-FOUC script) |
| Notifications | `Notifications.tsx` (batch queries, grouping), `BottomNav.tsx` (badge), new `/notifications/settings` route |
| Error handling | new `lib/safeCall.ts`, route-level error boundaries in `App.tsx` |

### Migrations
1. `article_dismissals (id, user_id uuid, article_id uuid, reason text, created_at)` + RLS (owner-only read/write/delete).
2. Trigger on `reported_articles` insert → insert admin notification rows.

### Phasing / Priority
- **P0 (ship first):** Phase 1 bugs, Phase 3 not-interested + share, Phase 4 banner, Phase 5 theme.
- **P1:** Phase 2 reactions polish, Phase 6 notifications, Phase 7 error handling.
- **P2:** Phase 8 cross-cutting polish.

No external dependencies added. All work fits the existing Tailwind / Supabase / TanStack stack.
