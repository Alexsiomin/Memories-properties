
-- Developers table: each property developer with their XML feed
CREATE TABLE public.developers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  xml_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers viewable by everyone"
  ON public.developers FOR SELECT
  USING (true);

CREATE POLICY "Admins insert developers"
  ON public.developers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update developers"
  ON public.developers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete developers"
  ON public.developers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_developers_updated_at
  BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tag properties with the developer that supplied them
ALTER TABLE public.properties
  ADD COLUMN developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL;

CREATE INDEX idx_properties_developer_id ON public.properties(developer_id);
