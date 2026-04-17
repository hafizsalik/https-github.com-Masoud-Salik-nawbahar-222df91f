-- ========================================
-- LinkedIn-Style Reaction System - RPC Functions
-- Implements toggle_reaction for efficient reaction management
-- ========================================

-- Create or replace toggle_reaction function
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_article_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_reaction TEXT;
  v_total_count INT;
  v_top_reactions JSONB;
  v_top_types TEXT[];
BEGIN
  -- Validate reaction type
  IF p_reaction_type NOT IN ('like', 'love', 'insightful', 'laugh', 'sad') THEN
    RAISE EXCEPTION 'Invalid reaction type: %', p_reaction_type;
  END IF;

  -- Check if user already has a reaction on this article
  SELECT reaction_type INTO v_existing_reaction
  FROM public.reactions
  WHERE article_id = p_article_id AND user_id = p_user_id
  LIMIT 1;

  -- If same reaction, delete it (toggle off)
  IF v_existing_reaction = p_reaction_type THEN
    DELETE FROM public.reactions
    WHERE article_id = p_article_id AND user_id = p_user_id;
    
    v_existing_reaction := NULL;
  
  -- If different reaction exists, update it
  ELSIF v_existing_reaction IS NOT NULL THEN
    UPDATE public.reactions
    SET reaction_type = p_reaction_type
    WHERE article_id = p_article_id AND user_id = p_user_id;
  
  -- If no reaction exists, insert new one
  ELSE
    INSERT INTO public.reactions (article_id, user_id, reaction_type)
    VALUES (p_article_id, p_user_id, p_reaction_type);
    
    v_existing_reaction := p_reaction_type;
  END IF;

  -- Get updated counts and top reactions
  SELECT 
    COUNT(*)::INT,
    JSONB_BUILD_OBJECT(
      'like', COUNT(*) FILTER (WHERE reaction_type = 'like'),
      'love', COUNT(*) FILTER (WHERE reaction_type = 'love'),
      'insightful', COUNT(*) FILTER (WHERE reaction_type = 'insightful'),
      'laugh', COUNT(*) FILTER (WHERE reaction_type = 'laugh'),
      'sad', COUNT(*) FILTER (WHERE reaction_type = 'sad')
    )
  INTO v_total_count, v_top_reactions
  FROM public.reactions
  WHERE article_id = p_article_id;

  -- Get top reaction types (up to 5)
  SELECT ARRAY_AGG(key ORDER BY value DESC)
  INTO v_top_types
  FROM (
    SELECT key, value::INT FROM JSONB_EACH(v_top_reactions)
    WHERE value::INT > 0
    ORDER BY value::INT DESC
    LIMIT 5
  ) AS reactions;

  -- Return summary JSON
  RETURN JSONB_BUILD_OBJECT(
    'user_reaction', v_existing_reaction,
    'total_count', v_total_count,
    'top_types', COALESCE(v_top_types, ARRAY[]::TEXT[]),
    'counts_by_type', v_top_reactions
  );
END;
$$;

-- ========================================
-- Create reaction_summary view for quick lookups
-- ========================================

DROP VIEW IF EXISTS public.reaction_summary CASCADE;

CREATE VIEW public.reaction_summary AS
SELECT 
  r.article_id,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'like') as like_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'love') as love_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'insightful') as insightful_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'laugh') as laugh_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'sad') as sad_count,
  ARRAY(
    SELECT reaction_type 
    FROM (
      SELECT reaction_type, COUNT(*) as cnt 
      FROM public.reactions 
      WHERE article_id = r.article_id
      GROUP BY reaction_type
      ORDER BY cnt DESC
      LIMIT 3
    ) top_reactions
  ) as top_types
FROM public.reactions r
GROUP BY r.article_id;

-- Enable RLS on view
ALTER VIEW public.reaction_summary OWNER TO postgres;

-- ========================================
-- Create function to get reaction summary for article
-- ========================================

CREATE OR REPLACE FUNCTION public.get_reaction_summary(
  p_article_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response JSON;
  v_user_reaction TEXT;
  v_total_count INT;
  v_top_types TEXT[];
BEGIN
  -- Get user's current reaction
  SELECT reaction_type INTO v_user_reaction
  FROM public.reactions
  WHERE article_id = p_article_id AND user_id = p_user_id;

  -- Get summary from view
  SELECT 
    reactions.total_count,
    reactions.top_types
  INTO v_total_count, v_top_types
  FROM public.reaction_summary reactions
  WHERE reactions.article_id = p_article_id;

  -- Return summary
  v_response := JSONB_BUILD_OBJECT(
    'user_reaction', v_user_reaction,
    'total_count', COALESCE(v_total_count, 0),
    'top_types', COALESCE(v_top_types, ARRAY[]::TEXT[]),
    'article_id', p_article_id
  );

  RETURN v_response;
END;
$$;

-- ========================================
-- Indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_reactions_article_type ON public.reactions(article_id, reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_user_article ON public.reactions(user_id, article_id);

-- ========================================
-- Grant permissions
-- ========================================

GRANT EXECUTE ON FUNCTION public.toggle_reaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reaction_summary TO authenticated;
GRANT SELECT ON public.reaction_summary TO authenticated;
