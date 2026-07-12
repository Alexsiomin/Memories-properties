DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;

CREATE POLICY "Anyone can submit an enquiry"
ON public.enquiries FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND length(btrim(first_name)) >= 1
  AND length(btrim(first_name)) <= 120
  AND length(btrim(phone)) >= 3
  AND length(btrim(phone)) <= 40
  AND length(COALESCE(property_type, '')) <= 80
  AND length(COALESCE(region, '')) <= 80
);