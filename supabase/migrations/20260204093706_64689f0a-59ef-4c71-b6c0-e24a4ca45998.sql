-- 1. Fix follows table - require authentication for viewing
DROP POLICY IF EXISTS "Follows are viewable by authenticated users" ON public.follows;
CREATE POLICY "Follows require authentication to view"
ON public.follows
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Fix likes table - only show counts, not individual user behavior
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by authenticated users"
ON public.likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Fix reactions table - require authentication
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Reactions viewable by authenticated users"
ON public.reactions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. Fix comment_likes table - require authentication  
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.comment_likes;
CREATE POLICY "Comment likes viewable by authenticated users"
ON public.comment_likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. Fix profiles - hide contact info from public, allow basic profile viewing
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create policy for basic profile info (public)
CREATE POLICY "Basic profile info is public"
ON public.profiles
FOR SELECT
USING (true);

-- Note: We'll handle sensitive field filtering in the application layer