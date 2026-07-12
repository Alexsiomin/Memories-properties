
REVOKE EXECUTE ON FUNCTION public.compute_property_matches(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_property_match() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_client_stage_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_client_pipeline_stage() FROM PUBLIC, anon, authenticated;
