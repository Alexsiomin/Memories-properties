CREATE TABLE public.seo_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL UNIQUE,
  title text,
  description text,
  og_image text,
  noindex boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_settings TO authenticated;
GRANT ALL ON public.seo_settings TO service_role;

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO settings are publicly readable"
ON public.seo_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert SEO settings"
ON public.seo_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SEO settings"
ON public.seo_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete SEO settings"
ON public.seo_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_seo_settings_updated_at
BEFORE UPDATE ON public.seo_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();