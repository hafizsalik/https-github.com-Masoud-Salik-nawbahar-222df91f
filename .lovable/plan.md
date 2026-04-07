

# Production Upgrade Plan — Reactions & Engagement

## Goal
Upgrade the reaction system and overall engagement loop to production quality, inspired by Medium's approach: make reading rewarding, reactions meaningful, and the overall experience sticky enough that users return daily.

---

## Phase 1 — Fix Broken Reaction Icons (P0)

**Problem**: Reaction icons use CSS `mask-image` technique (`ReactionIcons.tsx`) which renders colored rectangles instead of actual icons when the SVG mask fails to load or when `currentColor` inheritance breaks.

**Fix**: Replace the `IconMask` approach with direct `<img>` tags (like `NawbaharIcon` already does) for the inactive state, and use the colored background approach only for the active state. This guarantees icons always render correctly.

**Files**: `src/components/articles/ReactionIcons.tsx`

---

## Phase 2 — Reaction Tray UX (Mobile-Critical)

**Problem**: The reaction picker tray opens above the button (`bottom-full mb-3`) which clips off-screen on mobile, especially for cards near the top. The tray is also too small and cramped.

**Fix**:
- Change the reaction picker tray to a **bottom sheet** on mobile (consistent with the three-dot menu pattern already implemented)
- Larger touch targets: 56px per reaction button instead of 48px
- Add the Persian label below each icon clearly
- Smooth spring animation on open/close
- Show the user's current reaction with a subtle colored ring highlight

**Files**: `src/components/articles/ReactionPicker.tsx`, `src/styles/reactions.css`

---

## Phase 3 — Medium-Style "Clap" Counter & Reaction Summary

**Problem**: Currently reactions show just a number. No social proof, no engagement pull.

**Fix** (inspired by Medium):
- On the **Article page**, show a rich reaction bar:
  - Top 3 reaction type icons stacked/overlapping (like LinkedIn)
  - Total count in Persian
  - Clicking the count opens the `ReactionDetailsModal`
  - Add a **bookmark/save** button on the right side of the reaction bar (currently missing from Article page)
  - Add a **share** button next to bookmark
- On **feed cards**, keep it minimal: icon + count only (already done, just ensure icons render)

**Files**: `src/components/articles/ArticleReactions.tsx`, `src/pages/Article.tsx`

---

## Phase 4 — Article Page Content Rendering

**Problem**: Article content renders as plain `whitespace-pre-wrap` text. All formatting from the editor (bold, italic, headings, lists) is lost.

**Fix**:
- Install `react-markdown` (or use a simple HTML parser if content is stored as HTML)
- Check what format the editor saves content in (plain text vs HTML vs markdown)
- Render content with proper typography: headings, bold, italic, lists, blockquotes, links
- Style with the existing `article-content` class using Tailwind prose-like styles

**Files**: `src/pages/Article.tsx`, possibly `src/index.css` for article typography

---

## Phase 5 — Bookmark from Article Page

**Problem**: There's no way to bookmark/save an article from the article detail page. Users must go back to the feed.

**Fix**:
- Add a bookmark toggle button in the Article page reaction bar
- Use existing `bookmarks` table — insert/delete on toggle
- Show filled/outlined bookmark icon based on state
- Toast confirmation on save/unsave

**Files**: `src/pages/Article.tsx`, new hook `src/hooks/useBookmark.ts`

---

## Phase 6 — Reading Progress Indicator

**Problem**: No visual indicator of reading progress on articles. Medium uses a progress bar at the top.

**Fix**:
- Add a thin (2px) progress bar at the top of the Article page that fills as the user scrolls
- Use brand purple color
- Disappears when fully read (100%)
- Lightweight: pure CSS + scroll event, no library

**Files**: `src/pages/Article.tsx`

---

## Phase 7 — Explore Page Server-Side Search

**Problem**: Explore fetches ALL articles and filters in JavaScript. Won't scale.

**Fix**:
- Create `useExploreArticles(filters)` hook that passes topic/tag/query to Supabase `.ilike()` and `.contains()` queries
- Remove client-side filtering from `Explore.tsx`
- Add debounced search (300ms) for text queries

**Files**: `src/pages/Explore.tsx`, new `src/hooks/useExploreArticles.ts`

---

## Phase 8 — "Continue Reading" Section

**Problem**: No way for users to resume articles they started but didn't finish. Medium prominently features this.

**Fix**:
- Track articles the user has opened (already done via `localStorage` view tracking)
- On the home feed, show a "ادامه مطالعه" section at the top with 1-3 partially-read articles (opened but not fully scrolled)
- Use the existing `useEngagementTracking` scroll percentage data
- Simple horizontal scroll cards

**Files**: `src/pages/Index.tsx`, `src/components/articles/ContinueReading.tsx`

---

## Phase 9 — Notification Badge on Bottom Nav

**Problem**: The bell icon in bottom nav has no unread count badge. Users don't know they have new notifications.

**Fix**:
- Query unread notification count from `notifications` table where `is_read = false`
- Show a small red dot or count badge on the bell icon in `BottomNav`
- Use realtime subscription to update in real-time

**Files**: `src/components/layout/BottomNav.tsx`

---

## Technical Summary

| Phase | What | Impact | Effort |
|-------|------|--------|--------|
| 1 | Fix broken reaction icons | P0 — icons show as colored squares | Small |
| 2 | Reaction tray as bottom sheet | P0 — mobile clipping | Medium |
| 3 | Rich reaction bar on article page | Engagement — social proof | Medium |
| 4 | Article content rendering | P1 — formatting completely lost | Medium |
| 5 | Bookmark from article page | Retention — save for later | Small |
| 6 | Reading progress bar | Engagement — completion motivation | Small |
| 7 | Server-side search | Scalability — won't work past 1000 articles | Medium |
| 8 | Continue Reading section | Retention — bring users back | Medium |
| 9 | Notification badge | Engagement — pull users back | Small |

