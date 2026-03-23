-- ========================================
-- CRITICAL SECURITY FIXES
-- Fix privilege escalation and data exposure issues
-- ========================================

-- ========================================
-- ISSUE 1: Remove any remaining public access to profiles table
-- ========================================

-- Drop any existing public policies that might still exist
DROP POLICY IF EXISTS "Profiles visible to everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible to authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate secure policies (in case they were modified)
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own full profile"
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admin can update any profile
CREATE POLICY "Admin can update any profile"
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure public_profiles view exists and is secure
DROP VIEW IF EXISTS public.public_profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  specialty,
  bio,
  reputation_score,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to public_profiles view (safe, no sensitive data)
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Revoke direct access to profiles table from anonymous users
REVOKE ALL ON public.profiles FROM anon;

-- ========================================
-- ISSUE 2: Secure user_roles table against privilege escalation
-- ========================================

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be too permissive
DROP POLICY IF EXISTS "Users can view user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update user_roles" ON public.user_roles;

-- Policy: Only admins can view user_roles
CREATE POLICY "Admin can view user_roles"
  ON public.user_roles 
  FOR SELECT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can insert user_roles (prevents privilege escalation)
CREATE POLICY "Admin can insert user_roles"
  ON public.user_roles 
  FOR INSERT 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can update user_roles (prevents privilege escalation)
CREATE POLICY "Admin can update user_roles"
  ON public.user_roles 
  FOR UPDATE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Only admins can delete user_roles
CREATE POLICY "Admin can delete user_roles"
  ON public.user_roles 
  FOR DELETE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revoke all permissions from non-admin users
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;

-- Grant only necessary permissions to admins
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- ========================================
-- ADDITIONAL SECURITY: Audit function
-- ========================================

-- Create function to check current user's role (for debugging)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_roles TEXT[];
  role_record RECORD;
BEGIN
  -- Get all roles for current user
  SELECT ARRAY_AGG(role) INTO user_roles
  FROM public.user_roles 
  WHERE user_id = auth.uid();
  
  -- Return comma-separated list or 'none'
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    RETURN 'none';
  ELSE
    RETURN array_to_string(user_roles, ', ');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to role checking function (read-only)
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- ========================================
-- SECURITY VERIFICATION
-- ========================================

-- Create a function to verify security policies are working
CREATE OR REPLACE FUNCTION public.verify_security_policies()
RETURNS TABLE(
  table_name TEXT,
  policy_name TEXT,
  policy_cmd TEXT,
  policy_roles TEXT,
  security_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.cmd::TEXT,
    COALESCE(p.roles, 'public')::TEXT,
    CASE 
      WHEN p.tablename = 'profiles' AND p.cmd = 'SELECT' AND p.roles = 'authenticated' THEN 'SECURE'
      WHEN p.tablename = 'profiles' AND p.cmd = 'SELECT' AND p.roles = 'public' THEN 'INSECURE - Public access to profiles!'
      WHEN p.tablename = 'user_roles' AND p.cmd IN ('INSERT', 'UPDATE') AND p.roles = 'authenticated' THEN 'INSECURE - Privilege escalation risk!'
      WHEN p.tablename = 'user_roles' AND p.cmd IN ('INSERT', 'UPDATE') AND p.policyname LIKE '%Admin%' THEN 'SECURE'
      ELSE 'REVIEW NEEDED'
    END::TEXT as security_status
  FROM pg_policies p 
  WHERE p.tablename IN ('profiles', 'user_roles')
  ORDER BY p.tablename, p.cmd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_security_policies() TO authenticated;

-- Log the security fixes
DO $$
BEGIN
  RAISE NOTICE 'Security fixes applied:';
  RAISE NOTICE '1. Removed public access to profiles table';
  RAISE NOTICE '2. Secured user_roles table against privilege escalation';
  RAISE NOTICE '3. Only admins can modify user_roles';
  RAISE NOTICE '4. WhatsApp numbers are now protected';
  RAISE NOTICE 'Run SELECT * FROM public.verify_security_policies() to verify';
END $$;
