-- FAQs table
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'homepage',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public can read active FAQs
CREATE POLICY "Active FAQs are viewable by everyone"
ON public.faqs FOR SELECT
USING (is_active = true);

-- Admins can read everything (including inactive)
CREATE POLICY "Admins can view all FAQs"
ON public.faqs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert FAQs"
ON public.faqs FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update FAQs"
ON public.faqs FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete FAQs"
ON public.faqs FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER faqs_set_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_faqs_category_sort ON public.faqs(category, sort_order);

-- Seed homepage FAQs
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
('What is off-market real estate?', 'Off-market real estate refers to properties sold privately, never publicly listed on portals or with mainstream agents. Vendors choose this route for discretion, speed, and to control who views the asset. Siomin sources these mandates exclusively for a private roster of investors and family offices.', 'homepage', 10),
('How do I view a Siomin property?', 'Viewings are arranged on request, typically following a brief introduction and, where appropriate, a non-disclosure agreement. We share full dossiers including tenancy, planning, comparables and modelled returns ahead of any site visit.', 'homepage', 20),
('What types of properties does Siomin source?', 'We focus on investment-grade European real estate: development land, agricultural estates, vineyards, coastal plots with tourism permits, mixed-use buildings, urban towers, heritage conversions, logistics, and strategic land for solar or wind.', 'homepage', 30),
('In which countries does Siomin operate?', 'Across Europe — with concentrated activity in Italy, France, Spain, Portugal, Greece, Germany, Austria, Netherlands, Belgium and the UK. Coverage extends opportunistically to Croatia, Cyprus, and the Baltics for select mandates.', 'homepage', 40),
('Is there a minimum investment to work with Siomin?', 'Mandates typically range from €2M to €150M+. We work with private clients, single-family offices, multi-family offices and institutional investors. Introductions are by referral or vetted application.', 'homepage', 50),
('How do I sell a property privately through Siomin?', 'Vendors with a single asset or portfolio above €5M can request a confidential valuation. We assess marketability, indicative pricing, and likely buyer profile within five business days, then propose a discreet sale process if mandated.', 'homepage', 60);