-- ========================================
-- Update Reactions System to Match LinkedIn Exactly
-- Change reaction types to: like, celebrate, support, insightful, appreciate, funny
-- Add algorithm weights for performance impact
-- ========================================

-- First, migrate existing data
UPDATE public.reactions SET reaction_type = 'celebrate' WHERE reaction_type = 'love';
UPDATE public.reactions SET reaction_type = 'funny' WHERE reaction_type = 'laugh';
UPDATE public.reactions SET reaction_type = 'support' WHERE reaction_type = 'sad';

-- Update toggle_reaction function with new types and weights
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
  v_algorithm_score INT;
BEGIN
  -- Validate reaction type (updated to LinkedIn's 6 reactions)
  IF p_reaction_type NOT IN ('like', 'celebrate', 'support', 'insightful', 'appreciate', 'funny') THEN
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

  -- Get updated counts and top reactions (updated types)
  SELECT
    COUNT(*)::INT,
    JSONB_BUILD_OBJECT(
      'like', COUNT(*) FILTER (WHERE reaction_type = 'like'),
      'celebrate', COUNT(*) FILTER (WHERE reaction_type = 'celebrate'),
      'support', COUNT(*) FILTER (WHERE reaction_type = 'support'),
      'insightful', COUNT(*) FILTER (WHERE reaction_type = 'insightful'),
      'appreciate', COUNT(*) FILTER (WHERE reaction_type = 'appreciate'),
      'funny', COUNT(*) FILTER (WHERE reaction_type = 'funny')
    )
  INTO v_total_count, v_top_reactions
  FROM public.reactions
  WHERE article_id = p_article_id;

  -- Calculate algorithm score based on reaction weights
  -- Insightful/Appreciate: 3 (strong), Celebrate: 2 (medium), others: 1 (weak)
  SELECT
    (COALESCE(v_top_reactions->>'insightful', '0')::INT * 3) +
    (COALESCE(v_top_reactions->>'appreciate', '0')::INT * 3) +
    (COALESCE(v_top_reactions->>'celebrate', '0')::INT * 2) +
    (COALESCE(v_top_reactions->>'like', '0')::INT * 1) +
    (COALESCE(v_top_reactions->>'support', '0')::INT * 1) +
    (COALESCE(v_top_reactions->>'funny', '0')::INT * 1)
  INTO v_algorithm_score;

  -- Get top reaction types (up to 6)
  SELECT ARRAY_AGG(key ORDER BY value DESC)
  INTO v_top_types
  FROM (
    SELECT key, value::INT FROM JSONB_EACH(v_top_reactions)
    WHERE value::INT > 0
    ORDER BY value::INT DESC
    LIMIT 6
  ) AS reactions;

  -- Return summary JSON with algorithm score
  RETURN JSONB_BUILD_OBJECT(
    'user_reaction', v_existing_reaction,
    'total_count', v_total_count,
    'top_types', COALESCE(v_top_types, ARRAY[]::TEXT[]),
    'counts_by_type', v_top_reactions,
    'algorithm_score', v_algorithm_score
  );
END;
$$;

-- Update reaction_summary view
DROP VIEW IF EXISTS public.reaction_summary CASCADE;

CREATE VIEW public.reaction_summary AS
SELECT
  r.article_id,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'like') as like_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'celebrate') as celebrate_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'support') as support_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'insightful') as insightful_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'appreciate') as appreciate_count,
  COUNT(*) FILTER (WHERE r.reaction_type = 'funny') as funny_count,
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
  ) as top_types,
  -- Calculate algorithm score
  (
    COUNT(*) FILTER (WHERE r.reaction_type = 'insightful') * 3 +
    COUNT(*) FILTER (WHERE r.reaction_type = 'appreciate') * 3 +
    COUNT(*) FILTER (WHERE r.reaction_type = 'celebrate') * 2 +
    COUNT(*) FILTER (WHERE r.reaction_type = 'like') * 1 +
    COUNT(*) FILTER (WHERE r.reaction_type = 'support') * 1 +
    COUNT(*) FILTER (WHERE r.reaction_type = 'funny') * 1
  ) as algorithm_score
FROM public.reactions r
GROUP BY r.article_id;

-- Enable RLS on view
ALTER VIEW public.reaction_summary OWNER TO postgres;

-- Update get_reaction_summary function
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
  v_algorithm_score INT;
BEGIN
  -- Get user's current reaction
  SELECT reaction_type INTO v_user_reaction
  FROM public.reactions
  WHERE article_id = p_article_id AND user_id = p_user_id;

  -- Get summary from view
  SELECT
    reactions.total_count,
    reactions.top_types,
    reactions.algorithm_score
  INTO v_total_count, v_top_types, v_algorithm_score
  FROM public.reaction_summary reactions
  WHERE reactions.article_id = p_article_id;

  -- Return summary
  v_response := JSONB_BUILD_OBJECT(
    'user_reaction', v_user_reaction,
    'total_count', COALESCE(v_total_count, 0),
    'top_types', COALESCE(v_top_types, ARRAY[]::TEXT[]),
    'algorithm_score', COALESCE(v_algorithm_score, 0),
    'article_id', p_article_id
  );

  RETURN v_response;
END;
$$;

-- Add reaction_type to comments table for simplified good/bad reactions
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS reaction_type TEXT CHECK (reaction_type IN ('good', 'bad'));

-- Create index for comment reactions
CREATE INDEX IF NOT EXISTS idx_comments_reaction_type ON public.comments(reaction_type) WHERE reaction_type IS NOT NULL;

-- Function to toggle comment reaction (simplified: only good/bad)
CREATE OR REPLACE FUNCTION public.toggle_comment_reaction(
  p_comment_id UUID,
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
BEGIN
  -- Validate reaction type
  IF p_reaction_type NOT IN ('good', 'bad') THEN
    RAISE EXCEPTION 'Invalid comment reaction type: %', p_reaction_type;
  END IF;

  -- Check if user already has a reaction on this comment
  SELECT reaction_type INTO v_existing_reaction
  FROM public.comments
  WHERE id = p_comment_id AND user_id = p_user_id
  LIMIT 1;

  -- If same reaction, remove it
  IF v_existing_reaction = p_reaction_type THEN
    UPDATE public.comments
    SET reaction_type = NULL
    WHERE id = p_comment_id AND user_id = p_user_id;
    
    v_existing_reaction := NULL;
  ELSE
    -- Set or change reaction
    UPDATE public.comments
    SET reaction_type = p_reaction_type
    WHERE id = p_comment_id AND user_id = p_user_id;
    
    v_existing_reaction := p_reaction_type;
  END IF;

  -- Return result
  RETURN JSONB_BUILD_OBJECT(
    'user_reaction', v_existing_reaction,
    'comment_id', p_comment_id
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.toggle_comment_reaction TO authenticated;