CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  label TEXT,
  value TEXT,
  sub TEXT,
  numeric_value NUMERIC,
  numeric_x NUMERIC,
  numeric_y NUMERIC,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_insights_section ON public.insights(section, sort_order);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active insights viewable by everyone"
ON public.insights FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins view all insights"
ON public.insights FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert insights"
ON public.insights FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update insights"
ON public.insights FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete insights"
ON public.insights FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_insights_updated_at
BEFORE UPDATE ON public.insights
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed selectivity stats
INSERT INTO public.insights (section, label, value, sub, sort_order) VALUES
('selectivity', 'Mandates accepted', '3', 'this quarter', 1),
('selectivity', 'Enquiries reviewed', '47', 'past 90 days', 2),
('selectivity', 'Selectivity rate', '94%', 'declined or deferred', 3),
('selectivity', 'Median ticket', '€12.4M', 'across active book', 4);

-- Seed asset mix
INSERT INTO public.insights (section, label, numeric_value, sort_order) VALUES
('asset_mix', 'Villa', 38, 1),
('asset_mix', 'Land', 27, 2),
('asset_mix', 'Commercial', 18, 3),
('asset_mix', 'Apartment', 11, 4),
('asset_mix', 'Mixed-use', 6, 5);

-- Seed price trend
INSERT INTO public.insights (section, label, numeric_value, sort_order) VALUES
('price_trend', 'Q1 24', 6450, 1),
('price_trend', 'Q2 24', 6720, 2),
('price_trend', 'Q3 24', 6880, 3),
('price_trend', 'Q4 24', 7110, 4),
('price_trend', 'Q1 25', 7320, 5),
('price_trend', 'Q2 25', 7480, 6),
('price_trend', 'Q3 25', 7690, 7),
('price_trend', 'Q4 25', 7920, 8);

-- Seed deals (numeric_x = size €M, numeric_y = days)
INSERT INTO public.insights (section, category, numeric_x, numeric_y, sort_order) VALUES
('deals', 'Cyprus', 2.4, 62, 1),
('deals', 'Cyprus', 4.1, 71, 2),
('deals', 'Greece', 6.8, 84, 3),
('deals', 'Cyprus', 8.2, 96, 4),
('deals', 'Greece', 10.5, 88, 5),
('deals', 'Mediterranean', 12.4, 102, 6),
('deals', 'Cyprus', 14.9, 118, 7),
('deals', 'Greece', 18.3, 134, 8),
('deals', 'Mediterranean', 22.7, 151, 9),
('deals', 'Mediterranean', 27.5, 162, 10),
('deals', 'Greece', 33.0, 178, 11),
('deals', 'Mediterranean', 38.6, 196, 12);