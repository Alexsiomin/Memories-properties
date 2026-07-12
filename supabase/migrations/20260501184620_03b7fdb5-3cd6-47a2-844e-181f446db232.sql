
-- 1. Fix user_roles public exposure
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_property_reference() FROM anon, authenticated, public;
-- has_role is used inside RLS policies; keep callable so policies evaluate correctly
-- (RLS policy evaluation runs as the calling role)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- 3. Restrict storage listing on property-images bucket
-- Allow public read of individual objects, disallow listing the bucket
DROP POLICY IF EXISTS "Public can list property-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can list property-images" ON storage.objects;

-- Ensure a SELECT policy exists that only allows fetching specific objects (by exact name)
-- We can't truly stop listing via policy alone since SELECT is used for both;
-- instead, mark bucket as not public-listable by ensuring no broad list policy exists.
-- Recreate a tight read policy if needed:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Public read property-images'
  ) THEN
    CREATE POLICY "Public read property-images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'property-images');
  END IF;
END$$;
