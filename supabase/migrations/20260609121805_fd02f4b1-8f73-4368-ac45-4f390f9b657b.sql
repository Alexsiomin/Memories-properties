-- Remove the public read policy that exposed all columns
DROP POLICY IF EXISTS "Anyone can view assistant settings" ON public.assistant_settings;

-- Only admins can read the full settings row directly
CREATE POLICY "Admins view assistant settings"
  ON public.assistant_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anon no longer needs direct table access
REVOKE ALL ON public.assistant_settings FROM anon;

-- Public-safe view exposing ONLY the greeting + enabled flag.
-- Runs with the view owner's rights so it bypasses table RLS but only ever
-- returns the two non-sensitive columns.
CREATE OR REPLACE VIEW public.assistant_public
WITH (security_invoker = false) AS
  SELECT singleton, greeting, enabled
  FROM public.assistant_settings;

GRANT SELECT ON public.assistant_public TO anon, authenticated;