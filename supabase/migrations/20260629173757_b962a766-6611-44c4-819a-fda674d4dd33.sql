DROP POLICY IF EXISTS "Anyone can create alerts" ON public.property_alerts;

CREATE POLICY "Anyone can create alerts"
ON public.property_alerts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (user_id IS NULL OR user_id = auth.uid())
);