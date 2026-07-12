
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS internal_area text,
  ADD COLUMN IF NOT EXISTS covered_verandas text;
