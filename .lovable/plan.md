## Goal

1. Let signed-out visitors see published articles on the home feed.
2. Run a deep mobile-first audit of the platform and fix the highest-impact issues.

---

## Part 1 — Show articles to guests (root cause found)

The home feed calls Supabase REST as `anon`. The `articles` SELECT policy is:

```
status = 'published' OR author_id = auth.uid() OR has_role(auth.uid(), 'admin')
```

Calling that policy as `anon` errors with `permission denied for function has_role` — so PostgREST returns 0 rows and the UI shows "هنوز مقاله‌ای نیست". Same risk on `useSmartFeed`, `usePublishedArticles`, `useExploreArticles`, `useTrendingArticles`, profile reads, reactions, etc.

### Fix (migration)

- `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;`
- Rewrite policy to short-circuit so anonymous reads never need `has_role`:
  `status = 'published' OR (auth.uid() IS NOT NULL AND (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))`
- Audit and `GRANT SELECT` to `anon` on the public-read tables the feed touches: `articles`, `profiles`, `article_reactions` (counts/top reactors), `comments` (counts), `follows` (counts), `article_tags` if used. Keep auth-only tables (`bookmarks`, `notifications`, `user_roles`, `dismissed_articles`, drafts) restricted.
- Re-test the same anon REST call after the migration.

### Frontend tweaks

- `useSmartFeed` / `usePublishedArticles`: no auth gate needed once RLS is fixed — verify they don't accidentally require `user`.
- Guest-friendly empty state: keep current copy only when truly zero rows; for guests, show a soft "ورود برای تجربه شخصی" CTA below the feed instead of blocking it.
- Guarded actions (react, bookmark, follow, comment, write) keep their existing redirect-to-auth behavior (already implemented per memory `guest-auth-redirect-logic`).

---

## Part 2 — Mobile-focused deep audit

Scope: viewport ≤ 414px on the live preview, real-device class (low-end Android). I will:

1. **Reproduce & log runtime errors**
   - Current console shows `ReferenceError: handleReactionHover is not defined`. The symbol exists in `ReactionPickerButton.tsx` (line 283), so this is likely a stale chunk / dead-code path. Re-trace with browser tools, repro on a card, and fix the real call site (probably a leftover handler reference outside the component scope or a closure created before the recent rewrite).
   - Capture any other runtime errors during: open card → react → scroll feed → open article → comment → follow → bookmark → navigate via bottom nav.

2. **Reaction stability regression check**
   - Verify the fix from last turn (`useCardReactions` ref-based optimistic update) holds across: double-tap, switch reaction, offline, slow 3G.

3. **Mobile UX / layout sweep** (RTL, 360–414px)
   - Bottom nav overlap with content / safe-area-inset on iOS PWA.
   - Header drawer + search input hit-targets ≥ 44px.
   - Article card: title clamping, cover image aspect, tag overflow, action row tap-targets.
   - Reaction picker positioning near screen edges and inside scroll containers.
   - Comment sheet: keyboard push, scroll lock, dismiss on outside tap.
   - Long-press / swipe gestures not hijacking native scroll.

4. **Performance** (matches memory `mobile-performance-target`)
   - `browser--performance_profile` on `/` and `/article/:id`.
   - Confirm image compression path is used for uploads; lazy-load article covers; check for N+1 queries the 2-step fetch should already prevent.
   - Look for re-render storms in feed (memoization of `ArticleCard`).

5. **Offline / PWA**
   - Verify offline fallback renders (memory `offline-fallback-ui`) and SW doesn't intercept `/~oauth`.
   - Confirm install button and update flow on Android Chrome.

6. **Accessibility / RTL**
   - `dir="rtl"` consistency, focus-visible rings, color contrast on muted text, Persian number formatting in counts.

### Deliverable for Part 2

A prioritized fix list (P0 crash/blockers → P1 UX → P2 polish) with the actual code edits applied for P0/P1 in this same build pass. P2 items will be listed for follow-up.

---

## Technical details

- Migration file: single SQL with `GRANT EXECUTE` + policy replacement + `GRANT SELECT` to anon on public-read tables.
- No edits to `src/integrations/supabase/client.ts` or `types.ts`.
- Keep all UI changes inside existing components; no new design tokens.
- Use `code--exec` curl with anon key to verify each newly-public table after the migration.
