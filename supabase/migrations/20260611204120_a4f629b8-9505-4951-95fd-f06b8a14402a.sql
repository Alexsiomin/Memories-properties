CREATE TABLE public.brand_words (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_words TO authenticated;
GRANT SELECT ON public.brand_words TO anon;
GRANT ALL ON public.brand_words TO service_role;

ALTER TABLE public.brand_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active brand words"
  ON public.brand_words FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert brand words"
  ON public.brand_words FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brand words"
  ON public.brand_words FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brand words"
  ON public.brand_words FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_brand_words_updated_at
  BEFORE UPDATE ON public.brand_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.brand_words (word, sort_order) VALUES
  ('SIOMIN.', 0),
  ('PRIVATE.', 1),
  ('OFF-MARKET.', 2),
  ('CYPRUS.', 3);