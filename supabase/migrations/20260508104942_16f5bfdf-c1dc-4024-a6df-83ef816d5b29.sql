
-- 1. Defense-in-depth: explicit admin-only write policies on user_roles
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Prevent users from self-modifying server-calculated scores via direct API
CREATE OR REPLACE FUNCTION public.get_profile_score_field(_user_id uuid, _field text)
RETURNS double precision
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v double precision;
BEGIN
  IF _field = 'trust_score' THEN
    SELECT trust_score INTO v FROM public.profiles WHERE id = _user_id;
  ELSIF _field = 'reputation_score' THEN
    SELECT reputation_score INTO v FROM public.profiles WHERE id = _user_id;
  END IF;
  RETURN v;
END $$;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND trust_score IS NOT DISTINCT FROM public.get_profile_score_field(auth.uid(), 'trust_score')::integer
    AND reputation_score IS NOT DISTINCT FROM public.get_profile_score_field(auth.uid(), 'reputation_score')
  );

-- 3. Move whatsapp_number out of public profiles table; expose only to authenticated users
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id uuid PRIMARY KEY,
  whatsapp_number text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

INSERT INTO public.profile_contacts (user_id, whatsapp_number)
  SELECT id, whatsapp_number FROM public.profiles WHERE whatsapp_number IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;

CREATE POLICY "Authenticated users can view contacts"
  ON public.profile_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own contacts"
  ON public.profile_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own contacts"
  ON public.profile_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own contacts"
  ON public.profile_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS whatsapp_number;

-- 4. Storage: enforce path ownership on INSERT and add UPDATE policy; restrict listing
DROP POLICY IF EXISTS "Users can upload article covers" ON storage.objects;
CREATE POLICY "Users can upload article covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'article-covers'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own covers" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'article-covers'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'article-covers'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Restrict bucket listing to file owners. Public CDN URLs continue to serve files
-- directly, since 'article-covers' is a public bucket and public URL access bypasses RLS.
DROP POLICY IF EXISTS "Article covers are publicly accessible" ON storage.objects;
CREATE POLICY "Cover owners can list own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'article-covers'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
