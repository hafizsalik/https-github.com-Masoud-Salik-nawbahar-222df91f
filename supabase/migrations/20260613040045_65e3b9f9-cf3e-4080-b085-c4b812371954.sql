CREATE INDEX IF NOT EXISTS idx_articles_feed_engagement
  ON public.articles (engagement_score DESC, created_at DESC)
  WHERE status = 'published';