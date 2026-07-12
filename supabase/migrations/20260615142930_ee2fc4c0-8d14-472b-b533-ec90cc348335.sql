DROP POLICY IF EXISTS "Anyone can request a tour" ON public.tour_requests;

CREATE POLICY "Anyone can request a tour"
ON public.tour_requests FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND length(btrim(full_name)) >= 1 AND length(btrim(full_name)) <= 120
  AND length(btrim(email)) >= 3 AND length(btrim(email)) <= 200
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(COALESCE(message, ''::text)) <= 2000
  AND length(COALESCE(phone, ''::text)) <= 40
  AND status = 'pending'
);