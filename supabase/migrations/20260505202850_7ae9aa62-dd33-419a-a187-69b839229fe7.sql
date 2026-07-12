-- Update generator: 4 uppercase letters + dash + 5 digits, unique
CREATE OR REPLACE FUNCTION public.generate_property_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  letters text;
  digits  text;
  candidate text;
  attempts int := 0;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; -- no I/O for readability
BEGIN
  IF NEW.reference_code IS NOT NULL
     AND NEW.reference_code ~ '^[A-Z]{4}-[0-9]{5}$' THEN
    RETURN NEW;
  END IF;

  LOOP
    letters := substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
            || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
            || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
            || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
    digits  := lpad(floor(random()*100000)::text, 5, '0');
    candidate := letters || '-' || digits;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.properties WHERE reference_code = candidate
    );
    attempts := attempts + 1;
    EXIT WHEN attempts > 20;
  END LOOP;

  NEW.reference_code := candidate;
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists (re-create idempotently)
DROP TRIGGER IF EXISTS trg_generate_property_reference ON public.properties;
CREATE TRIGGER trg_generate_property_reference
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.generate_property_reference();

-- Backfill any rows whose reference doesn't match the new format
DO $$
DECLARE
  r record;
  letters text;
  digits text;
  candidate text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
BEGIN
  FOR r IN
    SELECT id FROM public.properties
    WHERE reference_code IS NULL OR reference_code !~ '^[A-Z]{4}-[0-9]{5}$'
  LOOP
    LOOP
      letters := substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
              || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
              || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1)
              || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
      digits  := lpad(floor(random()*100000)::text, 5, '0');
      candidate := letters || '-' || digits;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.properties WHERE reference_code = candidate);
    END LOOP;
    UPDATE public.properties SET reference_code = candidate WHERE id = r.id;
  END LOOP;
END $$;