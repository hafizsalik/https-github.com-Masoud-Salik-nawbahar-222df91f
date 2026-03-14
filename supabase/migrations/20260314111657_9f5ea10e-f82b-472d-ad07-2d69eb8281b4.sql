-- Fix 1: Allow anonymous users to view profiles (guest mode)
DROP POLICY IF EXISTS "Profiles visible to authenticated users" ON public.profiles;
CREATE POLICY "Profiles visible to everyone"
  ON public.profiles FOR SELECT
  TO public
  USING (true);

-- Fix 2: Allow anonymous users to view reactions (guest mode)
DROP POLICY IF EXISTS "Authenticated users can view reactions" ON public.reactions;
CREATE POLICY "Reactions viewable by everyone"
  ON public.reactions FOR SELECT
  TO public
  USING (true);