ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'individual';

CREATE OR REPLACE FUNCTION public.validate_property_seller_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.seller_type NOT IN ('individual','developer') THEN
    RAISE EXCEPTION 'Invalid seller_type: %', NEW.seller_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_property_seller_type ON public.properties;
CREATE TRIGGER trg_validate_property_seller_type
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.validate_property_seller_type();