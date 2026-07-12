CREATE TABLE public.auth_modal_settings (
  singleton boolean PRIMARY KEY DEFAULT true,
  heading text NOT NULL DEFAULT 'FREE ACCOUNT REQUIRED',
  subheading text NOT NULL DEFAULT 'Join thousands of clients searching for homes each month.',
  benefits jsonb NOT NULL DEFAULT '["Faster listings & priority access","See 27% more homes & sold history","Instant access to photos & features","Sold Properties","Price drop alerts & instant notifications"]'::jsonb,
  button_text text NOT NULL DEFAULT 'Continue with Google',
  divider_text text NOT NULL DEFAULT 'Private access',
  terms_text text NOT NULL DEFAULT 'By continuing, you agree to our Terms and Privacy Policy.',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_modal_settings_singleton CHECK (singleton = true)
);

GRANT SELECT ON public.auth_modal_settings TO anon, authenticated;
GRANT ALL ON public.auth_modal_settings TO service_role;
GRANT INSERT, UPDATE ON public.auth_modal_settings TO authenticated;

ALTER TABLE public.auth_modal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auth modal settings"
  ON public.auth_modal_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert auth modal settings"
  ON public.auth_modal_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update auth modal settings"
  ON public.auth_modal_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_auth_modal_settings_updated_at
  BEFORE UPDATE ON public.auth_modal_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.auth_modal_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;