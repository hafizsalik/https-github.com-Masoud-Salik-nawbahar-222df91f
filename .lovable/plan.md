# Production Upgrade Plan — نوبهار

## Identified Issues

### Critical Bugs

1. **Analytics writes to non-existent tables**: `analyticsService` writes to `user_devices`, `activity_logs`, `user_sessions`, `user_presence` — none of these tables exist in the database. Every call silently fails, spamming console errors and wasting network requests.
2. **Report system misuses** `reported_comments` **table**: `ArticleActionsMenu` inserts article reports into `reported_comments` using `comment_id: articleId` — semantically wrong and will cause confusion in admin moderation.
3. **Reaction race condition**: In `toggleReaction`, the optimistic update reads `summary.userReaction` (stale closure) to decide the DB operation, but the state has already been updated optimistically. If the user had a reaction and taps the same type, the optimistic update removes it, but the DB branch still sees the old value and tries to delete — this can cause double-deletes or missed updates.
4. `useCardReactions` **fetches per-card on mount**: Despite the memory note saying `autoFetch: false`, the feed passes `false` but the Article page passes `true` (default). Each card in the feed calls `getSession()` + queries `reactions` table — this is an N+1 query problem when scrolling. The `ensureFetched` lazy pattern is correct but the actual fetch also queries `profiles` for reactor names, which is unnecessary for the feed.
5. **Missing** `defaultCover` **asset**: `ArticleCard` imports `@/assets/default-cover.jpg` — if this file doesn't exist, the build will fail.

### UX / Design Issues

6. **No guest-mode friction control**: Guest users can tap reactions, comments, and responses but get silent failures or cryptic errors instead of a clear "login required" prompt.
7. **Article page uses raw** `article.content` **as plain text**: The content is rendered as `whitespace-pre-wrap` text — no markdown, no rich formatting. If the editor supports formatting (bold, italic, lists, quotes — the toolbar exists), the output is never parsed.
8. **Explore page loads ALL articles then filters client-side**: `usePublishedArticles()` fetches all articles, then `Explore` filters by topic/tag/query in JS. For 2000+ users this will degrade quickly. Search and filtering should be server-side.
9. **Hamburger menu opens from the right but the icon is on the left**: The button is on the left side of the header, but the drawer slides in from the right. This is counterintuitive for an RTL 
10.  **Broken reaction UI rendering**  
Reactions appear as colored squares instead of proper icons/emojis. This indicates incorrect rendering or missing assets. Reactions should display as standard emojis/icons with consistent styling, similar to modern social platforms.app.

### Performance Issues

10. `useComments` **called for every card**: Even with `lazy: true`, the hook still calls `checkAuth()` (which calls `getSession()`) on mount for every single card in the feed.
11. **Header makes a DB query on every mount**: `Header` fetches the user's profile (`avatar_url`, `display_name`) via a raw query on every render/mount instead of using a shared cache or context.
12. **No virtualization for long feeds**: The article feed renders all loaded articles in the DOM simultaneously. With infinite scroll loading 15+ pages, DOM complexity grows unbounded.

### Security / Data Integrity

13. **No** `reported_articles` **table**: Article reports go into `reported_comments` which is designed for comment reports. A dedicated table is needed.
14. `hidden_articles` **stored only in localStorage**: The "Not Interested" feature doesn't persist across devices or survive cache clears.

---

## Implementation Plan

### Phase 1 — Fix Critical Bugs (Immediate)

**Step 1: Neutralize broken analytics**

- Wrap all `analyticsService` methods in try-catch with silent fallback
- Remove the `as any` type casts that hide missing tables
- Either create the missing tables (`user_devices`, `activity_logs`, `user_sessions`, `user_presence`) via migration, or strip the analytics service to a no-op stub until tables exist

**Step 2: Fix reaction race condition**

- Capture `summary.userReaction` in a local variable before the optimistic update
- Use that captured value for the DB operation branch logic

**Step 3: Fix article report misuse**

- Create a `reported_articles` table via migration with proper RLS
- Update `ArticleActionsMenu` to insert into `reported_articles` instead of `reported_comments`

**Step 4: Verify** `default-cover.jpg` **exists**

- Check if the asset exists; if not, create a fallback or use a placeholder SVG

### Phase 2 — Performance (High Impact)

**Step 5: Eliminate N+1 auth calls**

- Create a shared `AuthContext` provider that caches the session
- Replace all `supabase.auth.getSession()` calls in hooks (`useComments`, `useCardReactions`, `ArticleActionsMenu`) with the context value
- This alone eliminates dozens of redundant auth calls per page load

**Step 6: Optimize feed reaction loading**

- Keep `autoFetch: false` for feed cards (already done)
- Remove reactor name fetching from `fetchReactions` when called from feed context — names are not displayed
- Batch-fetch user reactions for visible cards in a single query instead of per-card

**Step 7: Cache header profile data**

- Use React Query or the auth context to cache the current user's profile
- Remove the raw `supabase.from("profiles")` call in `Header`

### Phase 3 — UX Polish

**Step 8: Guest mode guardrails**

- Create a reusable `useRequireAuth()` hook that shows a toast + redirects to `/auth?view=login`
- Apply it to: reaction toggle, comment submit, bookmark, follow, write

**Step 9: Server-side search/filter for Explore**

- Add query params to the Supabase query in `usePublishedArticles` for tag/topic/text filtering
- Create a dedicated `useExploreArticles(filters)` hook with server-side filtering
- Use Supabase full-text search (`textSearch`) for the query parameter

**Step 10: Article content rendering**

- Parse the content as markdown/rich text in the Article page
- Support bold, italic, lists, quotes, headings that the editor toolbar provides

### Phase 4 — Stability & Polish

**Step 11: RTL menu direction fix**

- Move hamburger icon to the right side of the header (RTL convention) or change drawer to slide from the left

**Step 12: Add error boundaries to key sections**

- Wrap `ArticleCard`, `CommentSection`, and `ArticleReactions` in error boundaries to prevent single-card crashes from taking down the feed

**Step 13: Feed virtualization**

- Implement windowed rendering for the feed using `react-window` or intersection observer-based lazy rendering to cap DOM nodes

---

## Technical Summary


| Priority | Issue                               | Impact                         |
| -------- | ----------------------------------- | ------------------------------ |
| P0       | Analytics writing to missing tables | Console spam, wasted requests  |
| P0       | Reaction race condition             | Data inconsistency             |
| P0       | Report table misuse                 | Wrong data in admin panel      |
| P1       | N+1 auth/reaction queries           | Slow feed on mobile            |
| P1       | Header profile re-fetch             | Unnecessary DB calls           |
| P1       | Client-side search                  | Won't scale past 1000 articles |
| P2       | Guest mode UX                       | Silent failures confuse users  |
| P2       | Plain text article rendering        | Formatting lost                |
| P2       | Feed virtualization                 | DOM bloat on long sessions     |
| P3       | RTL menu direction                  | Minor UX inconsistency         |
