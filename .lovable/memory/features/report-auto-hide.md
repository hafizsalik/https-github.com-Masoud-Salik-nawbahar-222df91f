---
name: Report Auto-Hide & Acknowledgement
description: Comments hide automatically after 3 unique reports in 24h; reporters get a report_ack notification.
type: feature
---

When a user reports a comment, a DB trigger (`handle_comment_report`):
1. Inserts a `report_ack` notification for the reporter.
2. Counts distinct reporters in the last 24h on that comment. At ≥3, sets `comments.auto_hidden = true`.

`useComments` filters `auto_hidden = false` so regular readers no longer see flagged content. Admins keep visibility through the admin moderation page (which should NOT apply the filter).

Article reports also fire a `report_ack` to the reporter via `handle_article_report_notification`.

Notification formatters render both `report` (admin-facing) and `report_ack` (reporter-facing) with `Flag`/`ShieldCheck` icons.
