-- Allow developer-supplied reference codes to pass through unchanged.
CREATE OR REPLACE FUNCTION public.generate_property_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  letters text;
  digits  text;
  candidate text;
  attempts int := 0;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
BEGIN
  -- If a reference_code was supplied (any non-empty value), keep it as-is.
  IF NEW.reference_code IS NOT NULL AND length(trim(NEW.reference_code)) > 0 THEN
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
$function$;

-- Wipe the bad Aristo import so a fresh sync rebuilds with proper data
DELETE FROM public.properties
WHERE developer_id = 'aa672c37-eaee-4f74-bcf3-afe9174bb049';
