
CREATE OR REPLACE FUNCTION public.set_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  beds_part text := '';
  baths_part text := '';
  cat text;
  verb text;
  loc text;
  ref text;
  base text;
  candidate text;
  attempts int := 0;
BEGIN
  -- Keep an existing slug if nothing relevant changed on update
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND TG_OP = 'UPDATE' AND NEW.slug = OLD.slug THEN
    RETURN NEW;
  END IF;

  IF NEW.beds IS NOT NULL THEN
    beds_part := NEW.beds::text || 'bed ';
  END IF;
  IF NEW.baths IS NOT NULL THEN
    baths_part := NEW.baths::text || 'bath ';
  END IF;

  -- Singularise the category (Villas -> Villa)
  cat := coalesce(nullif(regexp_replace(coalesce(NEW.category, ''), 's$', '', 'i'), ''), 'property');

  verb := CASE
    WHEN lower(coalesce(NEW.status, '')) LIKE '%rent%'
      OR lower(coalesce(NEW.listing_type, '')) LIKE '%rent%'
    THEN 'for rent'
    ELSE 'for sale'
  END;

  loc := split_part(coalesce(NEW.location, ''), '·', 1);
  ref := coalesce(NEW.reference_code, '');

  base := public.slugify(
    beds_part || baths_part || cat || ' ' || verb || ' ' || loc ||
    CASE WHEN ref <> '' THEN ' id ' || ref ELSE '' END
  );

  IF base = '' OR base IS NULL THEN
    base := 'property';
  END IF;

  candidate := base;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.properties
      WHERE slug = candidate AND id <> NEW.id
    );
    attempts := attempts + 1;
    candidate := base || '-' || substr(md5(random()::text), 1, 4);
    EXIT WHEN attempts > 10;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

-- Backfill all existing rows to the new format
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.properties LOOP
    UPDATE public.properties SET slug = NULL WHERE id = r.id;
    UPDATE public.properties SET title = title WHERE id = r.id;
  END LOOP;
END $$;
