-- Rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role bypasses RLS; no policies for anon/authenticated means no access via Data API.
CREATE INDEX IF NOT EXISTS rate_limits_user_action_window_idx
  ON public.rate_limits (user_id, action, window_start DESC);

-- check_rate_limit: returns true if under limit (and records the hit), false if over.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_window_start timestamptz := now() - make_interval(secs => p_window_seconds);
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Purge old rows opportunistically (cheap, only for this user/action)
  DELETE FROM public.rate_limits
  WHERE user_id = v_user_id
    AND action = p_action
    AND window_start < v_window_start;

  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = v_user_id
    AND action = p_action
    AND window_start >= v_window_start;

  IF v_count >= p_max THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (user_id, action) VALUES (v_user_id, p_action);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated, service_role;