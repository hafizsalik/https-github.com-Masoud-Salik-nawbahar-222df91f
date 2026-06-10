
-- Atomic toggle_reaction: insert, switch, or remove a user's reaction in one round-trip.
-- Returns the resulting reaction_type (null if removed).
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_article_id uuid,
  p_user_id uuid,
  p_reaction_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing text;
BEGIN
  -- Caller must be the user they claim to be (defense in depth on top of RLS).
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT reaction_type INTO v_existing
  FROM public.reactions
  WHERE article_id = p_article_id AND user_id = p_user_id;

  IF v_existing IS NULL THEN
    INSERT INTO public.reactions (article_id, user_id, reaction_type)
    VALUES (p_article_id, p_user_id, p_reaction_type);
    RETURN p_reaction_type;
  ELSIF v_existing = p_reaction_type THEN
    DELETE FROM public.reactions
    WHERE article_id = p_article_id AND user_id = p_user_id;
    RETURN NULL;
  ELSE
    UPDATE public.reactions
    SET reaction_type = p_reaction_type, created_at = now()
    WHERE article_id = p_article_id AND user_id = p_user_id;
    RETURN p_reaction_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_reaction(uuid, uuid, text) TO authenticated;
