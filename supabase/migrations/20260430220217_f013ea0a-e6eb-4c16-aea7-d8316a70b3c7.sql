CREATE OR REPLACE FUNCTION public.generate_property_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.reference_code IS NOT NULL AND NEW.reference_code <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := 'SI-' || to_char(now(), 'YYMM') || '-' ||
                 upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.properties WHERE reference_code = candidate);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      candidate := 'SI-' || to_char(now(), 'YYMMDDHH24MISS');
      EXIT;
    END IF;
  END LOOP;
  NEW.reference_code := candidate;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_property_reference() FROM PUBLIC, anon, authenticated;