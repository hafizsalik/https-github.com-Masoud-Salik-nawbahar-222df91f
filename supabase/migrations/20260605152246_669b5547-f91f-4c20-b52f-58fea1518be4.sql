
DROP POLICY IF EXISTS "Follow relationships are viewable by everyone" ON public.follows;
CREATE POLICY "Authenticated users can view follow relationships"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
CREATE POLICY "Authenticated users can view reactions"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.follows FROM anon;
REVOKE SELECT ON public.reactions FROM anon;
