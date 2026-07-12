CREATE POLICY "Admins view all saved searches"
  ON public.saved_searches
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));