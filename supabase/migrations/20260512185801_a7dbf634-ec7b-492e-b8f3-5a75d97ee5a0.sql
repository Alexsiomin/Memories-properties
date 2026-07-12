
-- 1. Developers: restrict SELECT to admins only (xml_url contains private feed credentials)
DROP POLICY IF EXISTS "Developers viewable by everyone" ON public.developers;

CREATE POLICY "Admins view developers"
  ON public.developers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Remove match_alerts from the realtime publication so authenticated users
--    can't subscribe to other clients' alerts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'match_alerts'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.match_alerts';
  END IF;
END$$;

-- 3. Lock down SECURITY DEFINER functions. They run from triggers; no client should call them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_property_matches(uuid)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_property_match()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_client_stage_change()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_property_slug()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_client_created_by()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_property_reference()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_client_pipeline_stage()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_property_seller_type()      FROM PUBLIC, anon, authenticated;

-- has_role must stay callable by signed-in users because it's used inside RLS policies.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
