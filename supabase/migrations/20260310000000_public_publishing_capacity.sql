-- Capacity Management: Limit public article publishing to 2000 users
-- This migration adds tables and functions to manage publishing capacity

-- Create publishing capacity tracking table
CREATE TABLE IF NOT EXISTS public.publishing_capacity (
  total_capacity INT DEFAULT 2000 CHECK (total_capacity > 0),
  published_article_count INT DEFAULT 0 CHECK (published_article_count >= 0),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (total_capacity)
);

-- Add unique publisher constraint to articles (one article per publisher per day if at capacity)
CREATE TABLE IF NOT EXISTS public.publisher_daily_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  article_count INT DEFAULT 1 CHECK (article_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, published_date)
);

-- Initialize publishing capacity
INSERT INTO public.publishing_capacity (total_capacity, published_article_count)
VALUES (2000, (SELECT COUNT(*) FROM public.articles WHERE status = 'published'))
ON CONFLICT DO NOTHING;

-- Function to check if system has publishing capacity
CREATE OR REPLACE FUNCTION public.can_publish_article()
RETURNS BOOLEAN AS $$
DECLARE
  v_published_count INT;
  v_total_capacity INT;
BEGIN
  SELECT published_article_count, total_capacity 
  INTO v_published_count, v_total_capacity
  FROM public.publishing_capacity
  LIMIT 1;
  
  RETURN v_published_count < v_total_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment published article count
CREATE OR REPLACE FUNCTION public.increment_published_count()
RETURNS VOID AS $$
BEGIN
  UPDATE public.publishing_capacity
  SET published_article_count = published_article_count + 1,
      last_updated_at = CURRENT_TIMESTAMP
  WHERE total_capacity = 2000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current publishing stats
CREATE OR REPLACE FUNCTION public.get_publishing_stats()
RETURNS TABLE (
  capacity_used INT,
  total_capacity INT,
  remaining_capacity INT,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.published_article_count,
    pc.total_capacity,
    pc.total_capacity - pc.published_article_count,
    ROUND((pc.published_article_count::NUMERIC / pc.total_capacity) * 100, 2)
  FROM public.publishing_capacity pc
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update published article count when article is published
CREATE OR REPLACE FUNCTION public.on_article_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    -- Increment published count
    PERFORM public.increment_published_count();
    
    -- Update publisher daily quota
    INSERT INTO public.publisher_daily_quota (user_id, published_date, article_count)
    VALUES (NEW.author_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, published_date) 
    DO UPDATE SET article_count = article_count + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS article_publish_trigger ON public.articles;

-- Create new trigger
CREATE TRIGGER article_publish_trigger
AFTER UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.on_article_publish();

-- Policy: Enforce publishing capacity
CREATE OR REPLACE FUNCTION public.check_publishing_capacity()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.can_publish_article();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_publish_article() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_publishing_stats() TO authenticated;
GRANT SELECT ON TABLE public.publishing_capacity TO authenticated;
GRANT SELECT ON TABLE public.publisher_daily_quota TO authenticated;
