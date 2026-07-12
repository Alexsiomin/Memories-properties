
REVOKE EXECUTE ON FUNCTION public.set_property_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM PUBLIC, anon, authenticated;
