-- Property alerts: visitors (with or without an account) subscribe to criteria
CREATE TABLE public.property_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  label text,
  listing_type text,            -- 'sale' | 'rent' | null (any)
  categories text[],            -- property categories, empty/null = any
  regions text[],               -- regions/cities, empty/null = any
  budget_min numeric,
  budget_max numeric,
  min_beds int,
  min_baths int,
  tags text[],                  -- must-have feature tags
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_alerts_active ON public.property_alerts (active) WHERE active = true;
CREATE INDEX idx_property_alerts_user ON public.property_alerts (user_id);
CREATE INDEX idx_property_alerts_email ON public.property_alerts (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_alerts TO authenticated;
GRANT SELECT, INSERT ON public.property_alerts TO anon;
GRANT ALL ON public.property_alerts TO service_role;

ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can create an alert
CREATE POLICY "Anyone can create alerts" ON public.property_alerts
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Logged-in users manage their own alerts
CREATE POLICY "Users view own alerts" ON public.property_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON public.property_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alerts" ON public.property_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Admins can see all alerts
CREATE POLICY "Admins view all alerts" ON public.property_alerts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications generated when a new property matches an alert
CREATE TABLE public.property_alert_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES public.property_alerts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  property_title text,
  property_slug text,
  emailed_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (alert_id, property_id)
);

CREATE INDEX idx_alert_matches_user ON public.property_alert_matches (user_id) WHERE seen_at IS NULL;
CREATE INDEX idx_alert_matches_unemailed ON public.property_alert_matches (created_at) WHERE emailed_at IS NULL;

GRANT SELECT, UPDATE ON public.property_alert_matches TO authenticated;
GRANT ALL ON public.property_alert_matches TO service_role;

ALTER TABLE public.property_alert_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alert matches" ON public.property_alert_matches
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own alert matches" ON public.property_alert_matches
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all alert matches" ON public.property_alert_matches
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger for alerts
CREATE TRIGGER trg_property_alerts_updated_at
  BEFORE UPDATE ON public.property_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Matching function: find alerts that match a property and create notifications
CREATE OR REPLACE FUNCTION public.compute_property_alert_matches(_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p record;
  a record;
BEGIN
  SELECT * INTO p FROM public.properties WHERE id = _property_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Only notify for live/available listings
  IF p.status IS DISTINCT FROM 'available' THEN RETURN; END IF;

  FOR a IN SELECT * FROM public.property_alerts WHERE active = true LOOP
    -- listing_type
    IF a.listing_type IS NOT NULL AND a.listing_type <> '' AND a.listing_type <> p.listing_type THEN
      CONTINUE;
    END IF;
    -- categories
    IF coalesce(array_length(a.categories,1),0) > 0 AND NOT (p.category = ANY(a.categories)) THEN
      CONTINUE;
    END IF;
    -- regions (match region OR city)
    IF coalesce(array_length(a.regions,1),0) > 0
       AND NOT (p.region = ANY(a.regions) OR p.city = ANY(a.regions)) THEN
      CONTINUE;
    END IF;
    -- budget
    IF a.budget_min IS NOT NULL AND coalesce(p.price_value, 0) < a.budget_min THEN CONTINUE; END IF;
    IF a.budget_max IS NOT NULL AND a.budget_max > 0 AND coalesce(p.price_value, 0) > a.budget_max THEN CONTINUE; END IF;
    -- beds / baths
    IF a.min_beds IS NOT NULL AND coalesce(p.beds,0) < a.min_beds THEN CONTINUE; END IF;
    IF a.min_baths IS NOT NULL AND coalesce(p.baths,0) < a.min_baths THEN CONTINUE; END IF;
    -- must-have tags
    IF coalesce(array_length(a.tags,1),0) > 0 AND NOT (a.tags <@ coalesce(p.tags, '{}')) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.property_alert_matches
      (alert_id, property_id, user_id, email, property_title, property_slug)
    VALUES (a.id, p.id, a.user_id, a.email, p.title, p.slug)
    ON CONFLICT (alert_id, property_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Trigger on new/updated properties
CREATE OR REPLACE FUNCTION public.trg_property_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    PERFORM public.compute_property_alert_matches(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER property_alerts_match
  AFTER INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.trg_property_alert();