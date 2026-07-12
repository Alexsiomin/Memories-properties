REVOKE EXECUTE ON FUNCTION public.log_client_stage_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_property_match() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_property_matches(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_property_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon, authenticated;