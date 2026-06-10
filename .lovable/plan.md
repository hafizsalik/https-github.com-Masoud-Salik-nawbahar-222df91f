
## Goal

Take نوبهار from "works" to "feels native and trustworthy" — fix latent bugs, harden the backend, raise mobile UX to platform standards, and tighten the scientific credibility of the publishing pipeline. Mobile is the primary target; nothing in this plan regresses desktop.

Work ships in 6 phases. Each phase is independently shippable and safe to pause between.

---

## Phase 1 — Stability & correctness (P0, ship first)

These are real bugs / footguns I found while reading the code, not speculative cleanup.

### 1.1 Reactions pipeline
- **Nested interactive elements in `ArticleCard.tsx`** (lines 111–254): the entire card is wrapped in a `<Link>`, and inside it there are `<button>`s (author, expand, reaction picker, comment, response, ArticleActionsMenu). This is invalid HTML, breaks screen readers, and causes the iOS "drag link" preview on every long-press. Fix: drop the outer `<Link>`, make only the title + cover + excerpt navigate (programmatic `navigate()` on click), keep nested buttons as buttons.
- **Reaction count drift**: `ArticleCard` shows `article.reaction_count` (from the feed query, denormalized on `articles`) until the hover-only `ensureFetched` fires. On touch devices `ensureFetched` never runs, so the first tap optimistically increments from a possibly stale baseline. Fix: pass the feed's `reaction_count` as the hook's initial baseline, and call `ensureFetched` on the first `pointerdown` of the reactions row (not on `mouseenter`).
- **`toggle_reaction` RPC**: confirm it exists and is `SECURITY DEFINER` with `search_path=public`; if not, the current code silently catches and resyncs. Add a fallback path in `useCardReactions` that does plain `insert`/`update`/`delete` when the RPC is missing, so reactions never appear broken in prod.
- **Reaction picker still renders 456 lines per card**: extract the floating card into its own lazily-mounted component so list scroll stays cheap.

### 1.2 Duplicate notification subscriptions
`BottomNav` and `useNotifications` (mounted via `Header`) each open their own `postgres_changes` realtime channel filtered on the same `user_id`. That's 2 sockets per session and double work on every insert. Fix: delete the `BottomNav` channel + fetch, read `unreadCount` from `useNotifications` (already exposed), and lift the hook to one place so it isn't called twice per render tree.

### 1.3 Reading-progress bar misaligned
`Article.tsx` `<ReadingProgress />` is `top-[44px]` but the article header is `h-11` (44px) only on that page — and the global app `<Header>` is 52px elsewhere. Constrain to a relative wrapper or compute from the actual sticky header height.

### 1.4 Long-press / context-menu suppression
Current global `contextmenu` listener (in `main.tsx`) allowlists `.prose, article` — but `ArticleCard` uses `<article>` as the root, so the entire card re-enables the iOS preview card. Tighten the allowlist to `.article-prose, [data-allow-context]` and tag the reader body with that.

### 1.5 Comment sheet on mobile
- Lock body scroll while `SlideDownComments` is open (Radix scroll-lock or a small `useBodyScrollLock` hook).
- Lift the input above the iOS keyboard with a `visualViewport` listener.
- Dismiss on outside tap (currently only the `ChevronUp` button closes it).

### 1.6 Editor schedule-publish race
`ai-score-article` is invoked for scheduled posts in `publish-scheduled-articles`, but if the function fails (timeout, AI gateway down) the article stays `scheduled` forever. Add: max 3 retries with exponential backoff, then mark `status='needs_review'` and notify the author.

---

## Phase 2 — Backend hardening (P0/P1)

### 2.1 Rate limiting
Add a `public.rate_limits` table (`user_id, action, window_start, count`) plus a `check_rate_limit(action, max, window_seconds)` SQL function (SECURITY DEFINER). Apply in client + edge functions for:
- comments: 10 / 5 min
- reactions: 30 / min
- reports: 5 / hour
- article submit: 5 / day
- ai-score-article invocation: 10 / hour per user (service-role bypass)

### 2.2 Trigger-driven push notifications
`handle_like_notification`, `handle_comment_notification`, `handle_follow_notification` all read `vault.decrypted_secrets` and call `net.http_post` inside the trigger. Issues:
- if push fails, the original insert still succeeds (good), but errors are silent
- spam: every like fires a push even if the author muted that author
Fix: keep the insert into `notifications`, but move push dispatch to a `pg_cron` job that drains a `notification_outbox` table every 30s, respects per-user notification settings, and dedupes within a 10-min window (matches the client-side `dedupeByContext` already in `useNotifications`).

### 2.3 Schema integrity
Run `supabase--linter` and address: SECURITY DEFINER functions with missing `search_path`, tables without RLS, policies that reference `auth.uid()` from anon-allowed paths.

### 2.4 Secret hygiene
A secret named `Hafizsalik` is registered on the project. Audit and delete if it's leftover personal data; nothing in the codebase references it.

### 2.5 Service worker conflict
`vite-plugin-pwa` generates `/sw.js` and the project also ships `public/sw-push.js`. Confirm they're registered on different scopes and that neither caches `/~oauth`, `/auth/*`, or Supabase REST. If they overlap, consolidate push handling into the generated SW via `importScripts`.

---

## Phase 3 — Mobile UX (P1, the big visible win)

Scope: 360–414 px, RTL, iOS Safari + Android Chrome, light + dark.

### 3.1 Bottom navigation
- Add `env(safe-area-inset-bottom)` padding so the pill doesn't sit on the home indicator.
- Active label uses `text-primary` (already), but inactive `text-muted-foreground/40` fails WCAG AA in light theme. Bump to `/70`.
- Confirm 44×44 hit targets per tab.
- Render the unread badge from `useNotifications().unreadCount` (single source of truth, see 1.2).

### 3.2 Header
- Avatar and burger to a real 44×44 button each.
- Persistent compact logo+wordmark (small, centered, links to `/about`) on screens ≥ 380 px — keeps brand visible without crowding 360 px.
- Search input grows to fill the remaining row on focus (current 240 px max is cramped).

### 3.3 Article card
- Replace nested-link structure (see 1.1).
- `loading="lazy"` + `decoding="async"` everywhere (cover, avatar) — partially done, audit.
- Clamp title to 2 lines (already), excerpt to 4 lines (already); confirm tags row truncates with `…`.
- Add a subtle "خوانده‌شده" pill instead of just opacity for read state (more discoverable).
- Increase action-row hit targets to 40 px and add ≥ 8 px gap between icons.

### 3.4 Reaction picker
- Already viewport-clamped; add a tiny chevron pointer aligned with the trigger.
- On screens < 360 px the 6-emoji row overflows even after clamping — make it a horizontally scrollable row with snap-to-emoji.

### 3.5 Comment sheet
- See 1.5 (scroll lock, keyboard lift, outside-tap dismiss).
- Replace the inline `Textarea` + `Send` with a sticky bottom bar; reply UI becomes a temporary swap-in inside that bar (not a second inline textarea per comment).

### 3.6 Pull-to-refresh
The smart feed has no PTR. Add a small `useTouchPullToRefresh` hook on `/`, `/explore`, `/bookmarks`, `/notifications` — pure CSS overscroll-bounce + iconic spinner; invalidate the matching React Query key.

### 3.7 Skeletons everywhere
Replace the spinner-only `LoadingScreen` on `/`, `/article/:id`, `/profile/:id`, `/explore` with content-shaped skeletons (3 article-card skeletons on the feed, full-article skeleton on the reader). Perceived speed >> actual speed.

### 3.8 Numbers + dates
Audit every visible count and pass through `toPersianNumber` (`ArticleCardMetrics`, follower badges, view count, notifications badge, reaction picker labels). Same for dates → `formatSolarShort`.

### 3.9 Haptics & sounds
Already wired; sweep to ensure: reaction confirm = medium, comment send = success, follow = light, error = error. No haptic on idle scroll or hover.

---

## Phase 4 — Reader & writer polish (P1)

### 4.1 Article reader (`src/pages/Article.tsx`, 529 lines)
- Split into `<ArticleHeader>`, `<ArticleBody>`, `<ArticleFooter>`, `<InArticleSearch>` — easier to maintain and lets us memoize the body so reactions/comments don't re-render the prose.
- Add a "next article" card at the bottom (single recommendation, not a wall) using the existing related-articles logic.
- Reading time, view count, reaction breakdown surfaced inline (LinkedIn-style chip row).
- Tap-to-toggle the in-article search bar (`Cmd/Ctrl+F` parity).

### 4.2 Article editor (`src/pages/ArticleEditor.tsx`, 972 lines)
- Split into `<EditorToolbar>`, `<EditorBody>` (Qalam), `<EditorMetaPanel>` (tags, cover, schedule), `<EditorAIPanel>` (proofread + score preview).
- Autosave already exists; surface a small "ذخیره شد · ۲ ثانیه قبل" indicator instead of silent.
- Pre-flight: before submit, run the moderation criteria client-side preview using the same AI gate so authors aren't surprised by rejections.
- Image drop handler: confirm `compressArticleImage` runs (memory says it should — verify).

### 4.3 Scientific credibility surfaces
- On the article page, show the 5-criterion editorial score as a compact radar / bar (already in DB: `editorial_score_science/ethics/writing/timing/innovation`). Currently hidden from readers — surfacing it reinforces the platform's editorial standard.
- Citations: render `[۱]` style inline footnotes with hover/tap tooltip that opens a citation drawer. The `citations` table already exists.
- Author trust ring (already implemented) — confirm it shows on article header, not only on profile.

---

## Phase 5 — Performance (P1)

### 5.1 Feed
- Deduplicate `useSmartFeed` / `usePublishedArticles` / `useArticles`; settle on `useSmartFeed` as the single source for `/`.
- `engagement_score` ordering: confirm an index on `(status, engagement_score DESC, created_at DESC)` exists; add via migration if not.
- Virtualize the feed past 50 items with `@tanstack/react-virtual` (only if profiler shows scroll jank — measure first with `browser--performance_profile`).

### 5.2 Bundle
- `ArticleEditor` and `AdminDashboard` are already lazy. Audit `Article.tsx` imports — heavy ones (`DOMPurify`, recharts if any) should be dynamically imported.
- Replace `lucide-react` barrel imports with named imports where the bundler doesn't tree-shake.

### 5.3 React Query tuning
- Per-route `staleTime`: feed 60 s, article body 5 min, profile 2 min, comments 15 s.
- Persist query cache to `IndexedDB` (offline-first memory already exists) for the feed and the last 20 opened articles, so the app paints instantly on cold launch.

### 5.4 Realtime budget
Cap to one realtime channel per user (notifications). Stop opening per-article reaction channels; rely on optimistic UI + invalidate on focus.

---

## Phase 6 — Trust, safety, accessibility (P2)

### 6.1 Reporting workflow
- Reports today land in `reported_articles` / `reported_comments` and notify admins. Add: report acknowledgement to the reporter, "we reviewed and acted/dismissed" notification, and an audit log table.
- Anti-abuse: hide a comment automatically when ≥ 3 unique reporters flag it within 24 h, pending admin review.

### 6.2 Accessibility
- Run the `accessibility` skill against `/`, `/article/:id`, `/profile/:id`, `/write`.
- Fix the nested-link issue (1.1) — this alone resolves several a11y warnings.
- Skip-to-content link for keyboard users.
- All icon-only buttons get `aria-label` (audit; many already have it).

### 6.3 Empty states
Every list view (`/bookmarks`, `/notifications`, `/profile/:id` with no articles, `/explore` empty search) gets a friendly Persian empty state with an action ("اولین مقاله را بنویس", "نویسندگان پیشنهادی را ببین").

---

## Technical notes

**New files**:
- `src/hooks/useBodyScrollLock.ts`
- `src/hooks/useVisualViewportInset.ts`
- `src/hooks/useTouchPullToRefresh.ts`
- `src/components/articles/ArticleCardSkeleton.tsx`
- `src/components/articles/ArticleSkeleton.tsx`
- `src/components/articles/EditorialScoreChart.tsx`
- `src/components/articles/InArticleSearch.tsx`
- `src/lib/rateLimit.ts`

**New migrations**:
- `rate_limits` table + `check_rate_limit` function
- `notification_outbox` table + `drain_notification_outbox` function + `pg_cron` job (every 30 s)
- index on `articles(status, engagement_score DESC, created_at DESC)`
- audit columns + triggers on reports

**Refactors (no behavior change first, then upgrade)**:
- `src/pages/Article.tsx` → split into 4 files
- `src/pages/ArticleEditor.tsx` → split into 4 files
- `src/components/articles/ReactionPickerButton.tsx` → extract floating card

**Won't touch**:
- `src/integrations/supabase/{client,types}.ts`
- `supabase/config.toml`
- existing memory files (will add new ones as we ship phases)

**Validation per phase**:
- Phase 1: manual reaction taps across guest/auth/offline, comment open/close on iOS Safari, no console errors.
- Phase 2: `supabase--linter` clean, edge-function tests green, push notifications still arrive within 1 minute.
- Phase 3: `browser--performance_profile` on `/` at 360×800; LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
- Phase 4: AI gate dry-run returns scores in the editor preview; reader page reflows correctly with the score chart.
- Phase 5: query cache hits visible in network panel; cold-launch paint < 1 s on a cached feed.
- Phase 6: accessibility skill reports zero critical findings on the four audited pages.

---

## Open questions before I start building

1. **Push notifications outbox** (2.2): are you OK with up to 30 s extra delay on pushes in exchange for muting/dedupe correctness, or do you want them to stay near-instant?
2. **Editorial score visibility** (4.3): show the 5-criterion scores to all readers, or only to the author and admins?
3. **Auto-hide reported comments** (6.1): 3 unique reporters in 24 h — agree on threshold, or stricter (e.g. 5)?
4. **Phase order**: ship Phase 1 + 2 + 3 together as the first big release, or one phase per release so you can review the impact between them?
