
-- Allow anon role to execute has_role so RLS policies referencing it don't fail for guests
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_score_field(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_follower_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_follower_ids(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_following_ids(uuid) TO anon, authenticated;

-- Short-circuit the articles SELECT policy so anonymous reads never invoke has_role with a null uid path
DROP POLICY IF EXISTS "Published articles are viewable by everyone" ON public.articles;
CREATE POLICY "Published articles are viewable by everyone"
  ON public.articles FOR SELECT
  USING (
    status = 'published'
    OR (auth.uid() IS NOT NULL AND (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role)))
  );

-- Ensure anon + authenticated have base SELECT grants on public-read tables used by the feed
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT SELECT ON public.citations TO anon, authenticated;
GRANT SELECT ON public.profile_reviews TO anon, authenticated;
GRANT SELECT ON public.vip_posts TO anon, authenticated;

-- Allow guests to see reaction counts / top reactors on articles
DROP POLICY IF EXISTS "Reactions viewable by authenticated users" ON public.reactions;
CREATE POLICY "Reactions are viewable by everyone"
  ON public.reactions FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.reactions TO anon, authenticated;

-- Allow guests to see follow counts (used for follower stats on public profiles)
DROP POLICY IF EXISTS "Users can view own follow relationships" ON public.follows;
CREATE POLICY "Follow relationships are viewable by everyone"
  ON public.follows FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.follows TO anon, authenticated;
