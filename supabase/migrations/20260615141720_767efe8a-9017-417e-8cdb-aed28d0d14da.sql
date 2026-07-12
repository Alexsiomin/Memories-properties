-- 1. Status history table
CREATE TABLE public.property_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_title text,
  old_status text,
  new_status text,
  changed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.property_status_history TO authenticated;
GRANT ALL ON public.property_status_history TO service_role;

ALTER TABLE public.property_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view status history"
ON public.property_status_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function to log status changes
CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.property_status_history (property_id, property_title, old_status, new_status, changed_by)
    VALUES (NEW.id, NEW.title, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_property_status_change
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.log_property_status_change();

-- 2. Page views table
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  property_slug text,
  title text,
  referrer text,
  session_id text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page view"
ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view page views"
ON public.page_views FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_slug ON public.page_views (property_slug);