GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT SELECT ON public.brand_words TO anon;
UPDATE public.brand_words SET word = 'MEMORIES.' WHERE word = 'SIOMIN.';