
-- 1. Pipeline stage column on clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'lead';

-- Validation trigger (avoid CHECK constraint to keep it flexible)
CREATE OR REPLACE FUNCTION public.validate_client_pipeline_stage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage NOT IN ('lead','contacted','viewing','negotiating','won','lost') THEN
    RAISE EXCEPTION 'Invalid pipeline_stage: %', NEW.pipeline_stage;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_validate_pipeline_stage ON public.clients;
CREATE TRIGGER clients_validate_pipeline_stage
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_pipeline_stage();

-- 2. client_activities (timeline)
CREATE TABLE IF NOT EXISTS public.client_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  actor_id uuid,
  type text NOT NULL,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_activities_client ON public.client_activities(client_id, created_at DESC);

ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view client activities"
  ON public.client_activities FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert client activities"
  ON public.client_activities FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update client activities"
  ON public.client_activities FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete client activities"
  ON public.client_activities FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 3. client_tasks
CREATE TABLE IF NOT EXISTS public.client_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client ON public.client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_due ON public.client_tasks(due_at) WHERE completed_at IS NULL;

ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view client tasks"
  ON public.client_tasks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert client tasks"
  ON public.client_tasks FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update client tasks"
  ON public.client_tasks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete client tasks"
  ON public.client_tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER client_tasks_set_updated_at
  BEFORE UPDATE ON public.client_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. match_alerts
CREATE TABLE IF NOT EXISTS public.match_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_match_alerts_unseen ON public.match_alerts(created_at DESC) WHERE seen_at IS NULL;

ALTER TABLE public.match_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view match alerts"
  ON public.match_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert match alerts"
  ON public.match_alerts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update match alerts"
  ON public.match_alerts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete match alerts"
  ON public.match_alerts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 5. Auto-match function: scan clients, score against a property, insert alerts >= threshold
CREATE OR REPLACE FUNCTION public.compute_property_matches(_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  c record;
  total int;
  score int;
  pct numeric;
BEGIN
  SELECT * INTO p FROM public.properties WHERE id = _property_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR c IN SELECT * FROM public.clients LOOP
    total := 0;
    score := 0;

    -- listing_type vs looking_for
    IF c.looking_for IS NOT NULL THEN
      total := total + 1;
      IF c.looking_for = 'either'
         OR (c.looking_for = 'sale' AND p.listing_type = 'sale')
         OR (c.looking_for = 'rent' AND p.listing_type = 'rent') THEN
        score := score + 1;
      END IF;
    END IF;

    -- category
    IF coalesce(array_length(c.preferred_categories,1),0) > 0 THEN
      total := total + 1;
      IF p.category = ANY(c.preferred_categories) THEN score := score + 1; END IF;
    END IF;

    -- region
    IF coalesce(array_length(c.preferred_regions,1),0) > 0 THEN
      total := total + 1;
      IF p.region = ANY(c.preferred_regions) OR p.city = ANY(c.preferred_regions) THEN
        score := score + 1;
      END IF;
    END IF;

    -- budget
    IF c.budget_max IS NOT NULL THEN
      total := total + 1;
      IF p.price_value <= c.budget_max THEN score := score + 1; END IF;
    END IF;
    IF c.budget_min IS NOT NULL THEN
      total := total + 1;
      IF p.price_value >= c.budget_min THEN score := score + 1; END IF;
    END IF;

    -- beds / baths
    IF c.min_beds IS NOT NULL THEN
      total := total + 1;
      IF coalesce(p.beds,0) >= c.min_beds THEN score := score + 1; END IF;
    END IF;
    IF c.min_baths IS NOT NULL THEN
      total := total + 1;
      IF coalesce(p.baths,0) >= c.min_baths THEN score := score + 1; END IF;
    END IF;

    -- features
    IF coalesce(array_length(c.must_have_features,1),0) > 0 THEN
      total := total + array_length(c.must_have_features,1);
      score := score + (
        SELECT count(*) FROM unnest(c.must_have_features) f WHERE f = ANY(p.tags)
      )::int;
    END IF;

    IF total = 0 THEN CONTINUE; END IF;
    pct := (score::numeric / total::numeric) * 100;

    IF pct >= 70 THEN
      INSERT INTO public.match_alerts (client_id, property_id, score)
      VALUES (c.id, p.id, pct)
      ON CONFLICT (client_id, property_id) DO UPDATE SET score = EXCLUDED.score, seen_at = NULL;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_property_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.compute_property_matches(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_auto_match ON public.properties;
CREATE TRIGGER properties_auto_match
  AFTER INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.trg_property_match();

-- 6. Log stage changes to activity timeline
CREATE OR REPLACE FUNCTION public.log_client_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    INSERT INTO public.client_activities (client_id, actor_id, type, body, metadata)
    VALUES (NEW.id, auth.uid(), 'stage_change',
            'Stage: ' || OLD.pipeline_stage || ' → ' || NEW.pipeline_stage,
            jsonb_build_object('from', OLD.pipeline_stage, 'to', NEW.pipeline_stage));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_log_stage_change ON public.clients;
CREATE TRIGGER clients_log_stage_change
  AFTER UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_client_stage_change();
