# Upgrade Plan

Four scoped changes. Existing article page, reactions logic, and feed ranking remain untouched.

## 1. Inline Quick-View Expansion ("... بیشتر")

**Goal:** Add a lightweight inline reader inside `ArticleCard` without removing the existing navigation to `/article/:id`.

- In `ArticleCard.tsx`, replace the static `…` truncation with:
  - The truncated excerpt followed by an inline `…` + `بیشتر` button, both styled in the brand blue (`text-primary`), bold, hover underline.
  - Clicking `بیشتر` calls `e.preventDefault()` + `e.stopPropagation()` so the parent `<Link>` does NOT navigate, and toggles a local `expanded` state.
- When `expanded === true`:
  - Animate open with a smooth max-height/opacity transition (Tailwind + a small CSS keyframe, or `data-state` driven transition similar to existing `SlideDownComments`).
  - Render the full `article.content` inside the card in a clean reading layout (right-aligned RTL, `prose`-like spacing, no cover repeat, no author re-render).
  - Show a `بستن` button at the bottom that collapses it.
  - Trigger view tracking via the existing `useViewCount` / `useEngagementTracking` hook the same way the article page does (so reads still count).
- Quick-view is reading-only: NO comments, NO related articles, NO suggested writers, NO reactions panel beyond what `ArticleCardMetrics` already shows under the card.
- Clicking the title/cover/excerpt area (anywhere except `بیشتر`) keeps the current behavior → navigates to the full `/article/:id` page (with all its existing widgets).
- Infinite scrolling is already provided by `ArticleFeed`'s `IntersectionObserver`; expanded cards naturally push the next card down, giving a LinkedIn/Facebook-style continuous feed.

## 2. Admin Article Deletion

**Goal:** Allow admins to delete any article from the admin dashboard.

- In `src/pages/AdminDashboard.tsx`, in each row of the articles tabs (pending/published/rejected), add a red trash icon button.
- On click, open a shadcn `AlertDialog` titled "حذف مقاله" with body "آیا از حذف این مقاله مطمئن هستید؟ این عمل قابل بازگشت نیست." and Confirm/Cancel buttons.
- On confirm: `supabase.from('articles').delete().eq('id', id)`. RLS already allows admin delete (policy "Users can delete their own articles" includes `has_role(auth.uid(),'admin')`).
- After success: optimistic remove from local list, `toast.success("مقاله حذف شد")`, and invalidate the home feed query keys (`['articles-smart-feed']`, `['articles-published']`) so it disappears from the homepage instantly.
- Soft-delete/trash is **skipped** for now (can be added later as an `is_deleted` column + status filter — out of scope unless you confirm).

## 3. Public/Guest Access

**Goal:** Anyone (including signed-out visitors) can browse, open, and quick-view articles.

- Audit & confirm:
  - `/` (Index), `/article/:id`, and `/explore` are NOT wrapped in any auth guard. RLS for `articles` already allows `status = 'published'` for everyone.
  - Verify nothing in `AppLayout`/`Header` redirects guests to `/auth`.
- Ensure these guest-visible pages don't crash when `user` is `null` (already handled via `useAuth` returning `null`).
- Auth-gated actions remain protected via the existing `useRequireAuth` pattern (publish, comment, react, bookmark, follow, admin). Any place currently blocking *reading* for guests will be removed.
- Update Article page so any "sign in to continue reading" wall, if present, is removed.

## 4. Reaction Picker Position Fix

**Goal:** Center the reaction card on screen and ensure it never sits off-screen or hides count.

- In `ReactionPickerButton.tsx` (around line 341), the current `transform: translateX(-100%)` shifts the card fully left of the trigger, which can clip off-screen on narrow viewports.
- Replace the positioning logic so the card:
  - Is anchored above the trigger button with a small gap.
  - Uses `translateX(-50%)` and clamps `left` to `[12px, viewportWidth - cardWidth - 12px]` after measuring `cardRef` width on mount (existing `cardPosition` state already supports this).
  - Sits **above** the reactions count row, not overlapping it (verify `top` is computed from the trigger's `getBoundingClientRect().top - cardHeight - 8`).
- Reduce card padding by ~15% (`px-2 py-1.5` → `px-1.5 py-1`) and icon gap (`gap-0.5` already minimal) to shrink overall footprint.
- Verify on 865px and 375px widths that the full picker is visible and centered.

## Technical Notes

- Files touched:
  - `src/components/articles/ArticleCard.tsx` (inline expansion + بیشتر button)
  - `src/pages/AdminDashboard.tsx` (delete button + AlertDialog)
  - `src/components/articles/ReactionPickerButton.tsx` (positioning)
  - Possibly small audit edits in `src/pages/Article.tsx` / layout if a guest gate is found
- No DB migrations required — RLS already supports admin delete and public read.
- No new dependencies.

