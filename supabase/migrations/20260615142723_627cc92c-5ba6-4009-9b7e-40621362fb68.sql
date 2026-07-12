DROP POLICY IF EXISTS "Anyone can record a page view" ON public.page_views;

CREATE POLICY "Anyone can record a page view"
ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND char_length(path) <= 2048
  AND (referrer IS NULL OR char_length(referrer) <= 2048)
  AND (property_slug IS NULL OR char_length(property_slug) <= 512)
  AND (title IS NULL OR char_length(title) <= 1024)
  AND (session_id IS NULL OR char_length(session_id) <= 128)
);