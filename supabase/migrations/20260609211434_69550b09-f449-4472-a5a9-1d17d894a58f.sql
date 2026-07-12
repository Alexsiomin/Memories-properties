-- 1. Tighten the public "request a tour" INSERT policy (was WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can request a tour" ON public.tour_requests;
CREATE POLICY "Anyone can request a tour"
ON public.tour_requests
FOR INSERT
TO public
WITH CHECK (
  length(btrim(full_name)) BETWEEN 1 AND 120
  AND length(btrim(email)) BETWEEN 3 AND 200
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(coalesce(message, '')) <= 2000
  AND length(coalesce(phone, '')) <= 40
  AND status = 'pending'
);

-- 2. Remove broad public listing on the property-images bucket.
-- Files stay publicly accessible via their public URL (bucket is public),
-- but the storage API can no longer be used to enumerate all files.
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;

-- 3. Move the unaccent extension out of the public schema.
ALTER EXTENSION unaccent SET SCHEMA extensions;