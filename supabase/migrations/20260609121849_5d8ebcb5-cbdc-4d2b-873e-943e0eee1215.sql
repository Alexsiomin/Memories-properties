DROP VIEW IF EXISTS public.assistant_public;

CREATE OR REPLACE FUNCTION public.get_assistant_public()
RETURNS TABLE(greeting text, enabled boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT greeting, enabled
  FROM public.assistant_settings
  WHERE singleton = true
$$;

GRANT EXECUTE ON FUNCTION public.get_assistant_public() TO anon, authenticated;