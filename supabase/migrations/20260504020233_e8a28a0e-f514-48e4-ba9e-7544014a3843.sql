CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.tour_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  tour_type TEXT NOT NULL DEFAULT 'in_person',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tour_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a tour"
ON public.tour_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own tour requests"
ON public.tour_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all tour requests"
ON public.tour_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tour requests"
ON public.tour_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tour requests"
ON public.tour_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tour_requests_updated_at
BEFORE UPDATE ON public.tour_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tour_requests_property ON public.tour_requests(property_id);
CREATE INDEX idx_tour_requests_status ON public.tour_requests(status);