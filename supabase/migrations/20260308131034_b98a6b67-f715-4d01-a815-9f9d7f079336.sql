-- Create SECURITY DEFINER functions for follower/following lists
-- These bypass RLS to allow viewing follower lists on any profile

CREATE OR REPLACE FUNCTION public.get_follower_ids(target_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(follower_id), '{}') FROM public.follows WHERE following_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_ids(target_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(following_id), '{}') FROM public.follows WHERE follower_id = target_user_id;
$$;