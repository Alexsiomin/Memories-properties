
ALTER TABLE public.clients
  ADD COLUMN created_by UUID,
  ADD COLUMN looking_for TEXT NOT NULL DEFAULT 'sale',
  ADD COLUMN preferred_category TEXT,
  ADD COLUMN preferred_regions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN budget_min NUMERIC,
  ADD COLUMN budget_max NUMERIC,
  ADD COLUMN min_beds INTEGER,
  ADD COLUMN min_baths INTEGER;

CREATE OR REPLACE FUNCTION public.set_client_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_client_created_by_trigger
BEFORE INSERT ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_client_created_by();
