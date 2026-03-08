-- Make follower/following count functions SECURITY DEFINER so they bypass RLS
-- This allows viewing follower counts on any profile without exposing raw follows data

CREATE OR REPLACE FUNCTION public.get_follower_count(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.follows WHERE following_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_following_count(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.follows WHERE follower_id = target_user_id;
$$;