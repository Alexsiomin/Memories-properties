REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active brand words" ON public.brand_words;

CREATE POLICY "Public can view active brand words"
ON public.brand_words
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all brand words"
ON public.brand_words
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));