-- Function to generate unique 3-letter + 5-number reference codes
CREATE OR REPLACE FUNCTION public.generate_property_ref_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  code text;
  exists_count int;
BEGIN
  LOOP
    code := '';
    -- 3 random letters
    code := code || substr(letters, floor(random() * 26)::int + 1, 1);
    code := code || substr(letters, floor(random() * 26)::int + 1, 1);
    code := code || substr(letters, floor(random() * 26)::int + 1, 1);
    -- 5 random numbers
    code := code || lpad(floor(random() * 100000)::text, 5, '0');
    
    SELECT COUNT(*) INTO exists_count
    FROM public.properties
    WHERE reference_code = code;
    
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Backfill properties with NULL reference codes
UPDATE public.properties
SET reference_code = public.generate_property_ref_code()
WHERE reference_code IS NULL OR reference_code = '';

-- Make reference_code unique
ALTER TABLE public.properties
ADD CONSTRAINT properties_reference_code_unique UNIQUE (reference_code);

-- Trigger to auto-generate reference_code on insert if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_property_ref_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference_code IS NULL OR NEW.reference_code = '' THEN
    NEW.reference_code := public.generate_property_ref_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_property_ref_code
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_property_ref_code();