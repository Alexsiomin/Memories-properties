CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  name text,
  email text,
  phone text,
  subject text,
  message text,
  property_id uuid,
  property_title text,
  preferred_date date,
  preferred_time text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND type IN ('contact','advisory','newsletter','property_enquiry','valuation')
  AND length(COALESCE(name, '')) <= 160
  AND length(COALESCE(email, '')) <= 255
  AND length(COALESCE(phone, '')) <= 40
  AND length(COALESCE(subject, '')) <= 160
  AND length(COALESCE(message, '')) <= 4000
  AND length(COALESCE(property_title, '')) <= 300
  AND status = 'new'
);

CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins update contact submissions"
ON public.contact_submissions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contact submissions"
ON public.contact_submissions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));