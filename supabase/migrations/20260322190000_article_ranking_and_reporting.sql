-- Article Ranking System & Content Reporting
-- Created: March 2026
-- Purpose: Smart article ranking with engagement scoring and content reporting

-- ============================================
-- 1. ARTICLE RANKING CALCULATION
-- ============================================

-- Add ranking-related columns to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS final_weight FLOAT DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS rank_decay_date DATE DEFAULT CURRENT_DATE;

-- Create index for fast ranking queries
CREATE INDEX IF NOT EXISTS idx_articles_engagement_score ON public.articles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_final_weight ON public.articles(final_weight DESC);
CREATE INDEX IF NOT EXISTS idx_articles_rank_decay ON public.articles(rank_decay_date);

-- Function to calculate engagement score for an article
CREATE OR REPLACE FUNCTION public.calculate_article_engagement_score(article_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
  score FLOAT := 0;
  article_record RECORD;
BEGIN
  -- Get article metrics
  SELECT 
    view_count,
    reaction_count,
    comment_count,
    save_count,
    share_count,
    read_count,
    created_at
  INTO article_record
  FROM public.articles
  WHERE id = article_uuid;

  IF article_record IS NULL THEN
    RETURN 0;
  END IF;

  -- Weighted scoring (adjustable)
  -- Views: 1 point each (but capped to prevent spam)
  score := score + LEAST(COALESCE(article_record.view_count, 0), 1000) * 1.0;
  
  -- Reactions: 3 points each (strong engagement signal)
  score := score + COALESCE(article_record.reaction_count, 0) * 3.0;
  
  -- Comments: 5 points each (highest engagement)
  score := score + COALESCE(article_record.comment_count, 0) * 5.0;
  
  -- Saves: 4 points each (content quality signal)
  score := score + COALESCE(article_record.save_count, 0) * 4.0;
  
  -- Shares: 6 points each (viral signal)
  score := score + COALESCE(article_record.share_count, 0) * 6.0;
  
  -- Reads: 2 points each (actual consumption)
  score := score + COALESCE(article_record.read_count, 0) * 2.0;

  -- Time decay factor (newer articles get boost)
  -- Articles lose ~10% of score per day after first 3 days
  DECLARE
    days_old INTEGER := GREATEST(EXTRACT(DAY FROM (NOW() - article_record.created_at)), 0);
    time_boost FLOAT := CASE 
      WHEN days_old <= 1 THEN 1.5   -- First 24 hours: 50% boost
      WHEN days_old <= 3 THEN 1.2   -- Days 2-3: 20% boost
      WHEN days_old <= 7 THEN 1.0   -- Week 1: neutral
      ELSE GREATEST(0.3, 1.0 - (days_old - 7) * 0.1)  -- After week: decay 10% per day, floor at 30%
    END;
  BEGIN
    score := score * time_boost;
  END;

  RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update all article scores (run periodically)
CREATE OR REPLACE FUNCTION public.update_all_article_rankings()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE public.articles
  SET 
    engagement_score = public.calculate_article_engagement_score(id),
    rank_decay_date = CURRENT_DATE
  WHERE status = 'published'
    AND (rank_decay_date IS NULL OR rank_decay_date < CURRENT_DATE);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update single article score (call on interactions)
CREATE OR REPLACE FUNCTION public.update_article_ranking_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the article's engagement score
  UPDATE public.articles
  SET engagement_score = public.calculate_article_engagement_score(
    CASE 
      WHEN TG_TABLE_NAME = 'likes' THEN NEW.article_id
      WHEN TG_TABLE_NAME = 'bookmarks' THEN NEW.article_id
      WHEN TG_TABLE_NAME = 'comments' THEN NEW.article_id
      WHEN TG_TABLE_NAME = 'reactions' THEN NEW.article_id
      WHEN TG_TABLE_NAME = 'articles' THEN NEW.id
      ELSE NULL
    END
  )
  WHERE id = CASE 
    WHEN TG_TABLE_NAME = 'likes' THEN NEW.article_id
    WHEN TG_TABLE_NAME = 'bookmarks' THEN NEW.article_id
    WHEN TG_TABLE_NAME = 'comments' THEN NEW.article_id
    WHEN TG_TABLE_NAME = 'reactions' THEN NEW.article_id
    WHEN TG_TABLE_NAME = 'articles' THEN NEW.id
    ELSE NULL
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update rankings on interactions
DROP TRIGGER IF EXISTS update_ranking_on_like ON public.likes;
CREATE TRIGGER update_ranking_on_like
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_article_ranking_on_interaction();

DROP TRIGGER IF EXISTS update_ranking_on_bookmark ON public.bookmarks;
CREATE TRIGGER update_ranking_on_bookmark
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_article_ranking_on_interaction();

DROP TRIGGER IF EXISTS update_ranking_on_comment ON public.comments;
CREATE TRIGGER update_ranking_on_comment
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_article_ranking_on_interaction();

DROP TRIGGER IF EXISTS update_ranking_on_reaction ON public.reactions;
CREATE TRIGGER update_ranking_on_reaction
  AFTER INSERT OR DELETE ON public.reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_article_ranking_on_interaction();

-- ============================================
-- 2. CONTENT REPORTING SYSTEM
-- ============================================

-- Create content reports table
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'comment', 'profile')),
  report_reason TEXT NOT NULL,
  report_note TEXT, -- Optional user note
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_content_reports_content ON public.content_reports(content_id, content_type);
CREATE INDEX idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX idx_content_reports_created ON public.content_reports(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can create reports"
  ON public.content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
  ON public.content_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admin can view all reports"
  ON public.content_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update reports"
  ON public.content_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- View for admin report review (joins content details)
CREATE OR REPLACE VIEW public.content_reports_with_details AS
SELECT 
  cr.*,
  CASE 
    WHEN cr.content_type = 'article' THEN a.title
    WHEN cr.content_type = 'comment' THEN c.content
    ELSE NULL
  END as content_preview,
  CASE 
    WHEN cr.content_type = 'article' THEN a.author_id
    WHEN cr.content_type = 'comment' THEN c.user_id
    ELSE NULL
  END as content_author_id,
  reporter.display_name as reporter_name,
  resolver.display_name as resolver_name
FROM public.content_reports cr
LEFT JOIN public.articles a ON cr.content_type = 'article' AND cr.content_id = a.id
LEFT JOIN public.comments c ON cr.content_type = 'comment' AND cr.content_id = c.id
LEFT JOIN public.profiles reporter ON cr.reporter_id = reporter.id
LEFT JOIN public.profiles resolver ON cr.resolved_by = resolver.id;

-- Trigger for updated_at
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. INITIAL DATA MIGRATION
-- ============================================

-- Calculate initial scores for all published articles
SELECT public.update_all_article_rankings();

-- ============================================
-- 4. SCHEDULED JOB (Optional - requires pg_cron)
-- ============================================
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('update-article-rankings', '0 2 * * *', 'SELECT public.update_all_article_rankings()');

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE public.content_reports IS 'User-submitted content reports for admin review';
COMMENT ON COLUMN public.content_reports.report_note IS 'Optional note from the reporter explaining the issue';
COMMENT ON COLUMN public.content_reports.admin_notes IS 'Internal notes for admin staff';
COMMENT ON FUNCTION public.calculate_article_engagement_score IS 'Calculates engagement score based on views, reactions, comments, saves, and time decay';
