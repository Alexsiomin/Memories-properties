-- Enable unaccent extension first
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add slug column
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug text;

-- Slugify helper (uses unaccent which is now available)
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'extensions'
AS $$
  SELECT trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(input, ''))),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

-- Trigger function to set slug
CREATE OR REPLACE FUNCTION public.set_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base text;
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND TG_OP = 'UPDATE' AND NEW.slug = OLD.slug THEN
    RETURN NEW;
  END IF;

  base := public.slugify(NEW.title || '-' || split_part(NEW.location, '·', 1));
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

-- Trigger
DROP TRIGGER IF EXISTS trg_set_property_slug ON public.properties;
CREATE TRIGGER trg_set_property_slug
  BEFORE INSERT OR UPDATE OF title, location ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_property_slug();

-- Backfill existing rows by touching each one
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.properties WHERE slug IS NULL LOOP
    UPDATE public.properties SET title = title WHERE id = r.id;
  END LOOP;
END $$;

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS properties_slug_key ON public.properties(slug);
