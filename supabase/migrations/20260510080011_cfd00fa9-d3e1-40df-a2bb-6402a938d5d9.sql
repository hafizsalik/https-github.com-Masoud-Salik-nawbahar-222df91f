
-- 1. Profile contacts: restrict SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.profile_contacts;
CREATE POLICY "Users view own contacts"
  ON public.profile_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Reactions: restrict SELECT to authenticated users (counts are denormalized on articles)
DROP POLICY IF EXISTS "Reactions viewable by everyone" ON public.reactions;
CREATE POLICY "Reactions viewable by authenticated users"
  ON public.reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Lock down SECURITY DEFINER helper functions: revoke from PUBLIC/anon
REVOKE EXECUTE ON FUNCTION public.get_profile_score_field(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_follower_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_following_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_follower_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_following_ids(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_profile_score_field(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follower_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_follower_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_view_count(uuid) TO anon, authenticated;
